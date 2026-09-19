const BASE_URL = "https://mempool.space/testnet4/api";
const REQUEST_TIMEOUT_MS = 5000;
const SATOSHIS_PER_BTC = 100000000;

class MempoolTestnet4Error extends Error {
  constructor(message) {
    super(message);
    this.name = "MempoolTestnet4Error";
  }
}

const requestJson = async (path) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new MempoolTestnet4Error(`Mempool Testnet4 returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof MempoolTestnet4Error) {
      throw error;
    }
    if (error.name === "AbortError") {
      throw new MempoolTestnet4Error("Mempool Testnet4 request timed out");
    }
    throw new MempoolTestnet4Error("Unable to reach Mempool Testnet4");
  } finally {
    clearTimeout(timeout);
  }
};

const getAddressInfo = (address) => requestJson(`/address/${encodeURIComponent(address)}`);

const getAddressTransactions = (address) => requestJson(`/address/${encodeURIComponent(address)}/txs`);

const getTipHeight = async () => Number(await requestJson("/blocks/tip/height"));

const sumAddressOutputs = (outputs, address) => outputs.reduce(
  (total, output) => total + (output.scriptpubkey_address === address ? Number(output.value || 0) : 0),
  0,
);

const sumAddressInputs = (inputs, address) => inputs.reduce(
  (total, input) => total + (input.prevout?.scriptpubkey_address === address ? Number(input.prevout.value || 0) : 0),
  0,
);

const satoshisToBTC = (satoshis) => satoshis / SATOSHIS_PER_BTC;

const summarizeTransaction = (transaction, address, tipHeight) => {
  const receivedSatoshis = sumAddressOutputs(transaction.vout || [], address);
  const sentSatoshis = sumAddressInputs(transaction.vin || [], address);
  const confirmed = Boolean(transaction.status?.confirmed);
  const blockHeight = transaction.status?.block_height || null;
  const confirmations = confirmed && blockHeight ? Math.max(tipHeight - blockHeight + 1, 0) : 0;
  const direction = receivedSatoshis > 0 && sentSatoshis > 0
    ? "self"
    : sentSatoshis > 0
      ? "sent"
      : "received";

  return {
    txid: transaction.txid,
    confirmed,
    blockHeight,
    blockTime: transaction.status?.block_time ? new Date(transaction.status.block_time * 1000).toISOString() : null,
    receivedBTC: satoshisToBTC(receivedSatoshis),
    sentBTC: satoshisToBTC(sentSatoshis),
    netAmountBTC: satoshisToBTC(receivedSatoshis - sentSatoshis),
    direction,
    confirmations,
  };
};

const getAddressStatus = async (address) => {
  const [addressInfo, transactions, tipHeight] = await Promise.all([
    getAddressInfo(address),
    getAddressTransactions(address),
    getTipHeight(),
  ]);
  const confirmedSatoshis = Number(addressInfo.chain_stats?.funded_txo_sum || 0)
    - Number(addressInfo.chain_stats?.spent_txo_sum || 0);
  const unconfirmedSatoshis = Number(addressInfo.mempool_stats?.funded_txo_sum || 0)
    - Number(addressInfo.mempool_stats?.spent_txo_sum || 0);

  return {
    balance: {
      confirmedBTC: satoshisToBTC(confirmedSatoshis),
      unconfirmedBTC: satoshisToBTC(unconfirmedSatoshis),
      totalBTC: satoshisToBTC(confirmedSatoshis + unconfirmedSatoshis),
    },
    transactions: transactions.map((transaction) => summarizeTransaction(transaction, address, tipHeight)),
  };
};

module.exports = {
  MempoolTestnet4Error,
  getAddressInfo,
  getAddressTransactions,
  getTipHeight,
  getAddressStatus,
};