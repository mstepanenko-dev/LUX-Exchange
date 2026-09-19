const bitcoin = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const { ECPairFactory } = require("ecpair");

const { TESTNET4_NETWORK } = require("./bitcoinTestnetService");
const { decryptPrivateKey } = require("./walletEncryptionService");

const {
  getAddressUtxos,
  getRecommendedFees,
  broadcastTransaction,
} = require("./mempoolTestnet4Service");

const ECPair = ECPairFactory(ecc);

const SATOSHIS_PER_BTC = 100000000;
const DUST_THRESHOLD_SATOSHIS = 546;
const FALLBACK_FEE_RATE = 2;
const MAX_FEE_RATE = 20;

class BitcoinTestnet4TransactionError extends Error {
  constructor(message) {
    super(message);
    this.name = "BitcoinTestnet4TransactionError";
  }
}

class InsufficientBitcoinTestnet4FundsError extends BitcoinTestnet4TransactionError {
  constructor() {
    super("Insufficient confirmed Testnet4 balance including network fee.");
    this.name = "InsufficientBitcoinTestnet4FundsError";
  }
}

const parseAmountSatoshis = (amountBTC) => {
  if (typeof amountBTC !== "string" && typeof amountBTC !== "number") {
    throw new BitcoinTestnet4TransactionError(
      "Invalid Bitcoin Testnet4 amount."
    );
  }

  const amountText = String(amountBTC).trim();

  if (!/^\d+(?:\.\d{1,8})?$/.test(amountText)) {
    throw new BitcoinTestnet4TransactionError(
      "Invalid Bitcoin Testnet4 amount."
    );
  }

  const [whole, fraction = ""] = amountText.split(".");
  const satoshis = Number(`${whole}${fraction.padEnd(8, "0")}`);

  if (!Number.isSafeInteger(satoshis) || satoshis <= 0) {
    throw new BitcoinTestnet4TransactionError(
      "Invalid Bitcoin Testnet4 amount."
    );
  }

  return satoshis;
};

const validateTestnet4Address = (address) => {
  if (typeof address !== "string" || !address.trim()) {
    throw new BitcoinTestnet4TransactionError(
      "Invalid Bitcoin Testnet4 destination address."
    );
  }

  try {
    const normalizedAddress = address.trim();

    const decoded = bitcoin.address.fromBech32(normalizedAddress);

    if (
      decoded.prefix !== TESTNET4_NETWORK.bech32 ||
      decoded.version !== 0 ||
      decoded.data.length !== 20
    ) {
      throw new Error("Unsupported address");
    }

    return bitcoin.address.toOutputScript(
      normalizedAddress,
      TESTNET4_NETWORK
    );
  } catch (error) {
    throw new BitcoinTestnet4TransactionError(
      "Invalid Bitcoin Testnet4 destination address."
    );
  }
};

const getFeeRate = async () => {
  try {
    const fees = await getRecommendedFees();

    const providerFeeRate = Number(
      fees.halfHourFee || fees.hourFee || fees.fastestFee
    );

    if (Number.isFinite(providerFeeRate) && providerFeeRate > 0) {
      return Math.min(
        Math.max(Math.ceil(providerFeeRate), 1),
        MAX_FEE_RATE
      );
    }
  } catch (error) {
    return FALLBACK_FEE_RATE;
  }

  return FALLBACK_FEE_RATE;
};

const estimateFee = (inputCount, outputCount, feeRate) =>
  Math.ceil(
    (10 + inputCount * 68 + outputCount * 31) * feeRate
  );

const buildSignedTransaction = ({
  selectedUtxos,
  amountSatoshis,
  changeSatoshis,
  senderScript,
  destinationScript,
  keyPair,
}) => {
  const psbt = new bitcoin.Psbt({
    network: TESTNET4_NETWORK,
  });

  selectedUtxos.forEach((utxo) => {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: senderScript,
        value: BigInt(utxo.value),
      },
    });
  });

  psbt.addOutput({
    script: destinationScript,
    value: BigInt(amountSatoshis),
  });

  if (changeSatoshis > DUST_THRESHOLD_SATOSHIS) {
    psbt.addOutput({
      script: senderScript,
      value: BigInt(changeSatoshis),
    });
  }

  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();

  const transaction = psbt.extractTransaction();

  return {
    rawHex: transaction.toHex(),
    virtualSize: transaction.virtualSize(),
    outputSatoshis: transaction.outs.reduce(
      (total, output) => total + output.value,
      0n
    ),
  };
};

const sendBitcoinTestnet4 = async ({
  address,
  encryptedKey,
  toAddress,
  amountBTC,
}) => {
  const amountSatoshis = parseAmountSatoshis(amountBTC);
  const destinationScript = validateTestnet4Address(toAddress);

  const normalizedDestination = toAddress.trim();

  if (address === normalizedDestination) {
    throw new BitcoinTestnet4TransactionError(
      "Sender and destination addresses must be different."
    );
  }

  if (amountSatoshis <= DUST_THRESHOLD_SATOSHIS) {
    throw new BitcoinTestnet4TransactionError(
      "Bitcoin Testnet4 amount is below the dust threshold."
    );
  }

  if (typeof encryptedKey !== "string" || !encryptedKey) {
    throw new BitcoinTestnet4TransactionError(
      "Bitcoin Testnet4 wallet is unavailable."
    );
  }

  const [utxos, feeRate] = await Promise.all([
    getAddressUtxos(address),
    getFeeRate(),
  ]);

  const confirmedUtxos = utxos
    .filter(
      (utxo) =>
        utxo.status?.confirmed &&
        Number.isSafeInteger(Number(utxo.value)) &&
        Number(utxo.value) > 0
    )
    .map((utxo) => ({
      ...utxo,
      value: Number(utxo.value),
    }))
    .sort((left, right) => right.value - left.value);

  let selectedUtxos = [];
  let selectedSatoshis = 0;

  for (const utxo of confirmedUtxos) {
    selectedUtxos.push(utxo);
    selectedSatoshis += utxo.value;

    const estimatedFee = estimateFee(
      selectedUtxos.length,
      2,
      feeRate
    );

    if (
      selectedSatoshis >=
      amountSatoshis + estimatedFee
    ) {
      break;
    }
  }

  const estimatedFee = estimateFee(
    selectedUtxos.length,
    2,
    feeRate
  );

  if (
    !selectedUtxos.length ||
    selectedSatoshis <
      amountSatoshis + estimatedFee
  ) {
    throw new InsufficientBitcoinTestnet4FundsError();
  }

  let privateKey;

  try {
    privateKey = decryptPrivateKey(encryptedKey);

    const keyPair = ECPair.fromWIF(
      privateKey,
      TESTNET4_NETWORK
    );

    const senderPayment = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: TESTNET4_NETWORK,
    });

    if (
      !senderPayment.address ||
      senderPayment.address !== address ||
      !senderPayment.output
    ) {
      throw new BitcoinTestnet4TransactionError(
        "Bitcoin Testnet4 wallet address does not match its signing key."
      );
    }

    const initialChange =
      selectedSatoshis -
      amountSatoshis -
      estimatedFee;

    const initialTransaction =
      buildSignedTransaction({
        selectedUtxos,
        amountSatoshis,
        changeSatoshis: initialChange,
        senderScript: senderPayment.output,
        destinationScript,
        keyPair,
      });

    const requiredFee = Math.ceil(
      initialTransaction.virtualSize * feeRate
    );

    const changeSatoshis =
      selectedSatoshis -
      amountSatoshis -
      requiredFee;

    if (changeSatoshis < 0) {
      throw new InsufficientBitcoinTestnet4FundsError();
    }

    const finalTransaction =
      changeSatoshis >
      DUST_THRESHOLD_SATOSHIS
        ? buildSignedTransaction({
            selectedUtxos,
            amountSatoshis,
            changeSatoshis,
            senderScript:
              senderPayment.output,
            destinationScript,
            keyPair,
          })
        : buildSignedTransaction({
            selectedUtxos,
            amountSatoshis,
            changeSatoshis: 0,
            senderScript:
              senderPayment.output,
            destinationScript,
            keyPair,
          });

    const feeSatoshis =
      BigInt(selectedSatoshis) -
      finalTransaction.outputSatoshis;

    const txid =
      await broadcastTransaction(
        finalTransaction.rawHex
      );

    return {
      success: true,
      message:
        "Bitcoin Testnet4 transaction broadcast successfully.",
      transaction: {
        txid,
        from: address,
        to: normalizedDestination,
        amountBTC:
          amountSatoshis /
          SATOSHIS_PER_BTC,
        feeBTC:
          Number(feeSatoshis) /
          SATOSHIS_PER_BTC,
        network: "bitcoin-testnet4",
      },
    };
  } finally {
    privateKey = null;
  }
};

module.exports = {
  BitcoinTestnet4TransactionError,
  InsufficientBitcoinTestnet4FundsError,
  sendBitcoinTestnet4,
};