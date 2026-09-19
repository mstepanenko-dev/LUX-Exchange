const bitcoin = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const { ECPairFactory } = require("ecpair");

const ECPair = ECPairFactory(ecc);
const TESTNET4_NETWORK = {
  messagePrefix: "\x18Bitcoin Signed Message:\n",
  bech32: "tb",
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 111,
  scriptHash: 196,
  wif: 239,
};

const createBitcoinTestnet4Wallet = () => {
  const keyPair = ECPair.makeRandom({ network: TESTNET4_NETWORK });
  const payment = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: TESTNET4_NETWORK,
  });

  return {
    address: payment.address,
    privateKey: keyPair.toWIF(),
  };
};

module.exports = {
  TESTNET4_NETWORK,
  createBitcoinTestnet4Wallet,
};