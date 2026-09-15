const CACHE_TTL_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 5 * 1000;

const FIAT_CURRENCIES = new Set(["GBP", "EUR", "USD"]);
const SUPPORTED_CURRENCIES = new Set(["GBP", "EUR", "USD", "USDT", "BTC"]);
const cache = new Map();

class RateProviderError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "RateProviderError";
    this.code = "RATE_PROVIDER_UNAVAILABLE";
    this.cause = cause;
  }
}

const getCached = (key) => {
  const item = cache.get(key);

  if (item && item.expiresAt > Date.now()) {
    return item.rate;
  }

  if (item) {
    cache.delete(key);
  }

  return null;
};

const setCached = (key, rate) => {
  cache.set(key, {
    rate,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return rate;
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Provider returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new RateProviderError("Rate provider request failed", error);
  } finally {
    clearTimeout(timeout);
  }
};

const getFiatRate = async (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const key = `${fromCurrency}_${toCurrency}`;
  const cachedRate = getCached(key);

  if (cachedRate !== null) {
    return cachedRate;
  }

  try {
    const data = await fetchJson(
      `https://api.frankfurter.dev/v2/rate/${fromCurrency.toLowerCase()}/${toCurrency.toLowerCase()}`
    );
    const rate = Number(data.rate);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Provider returned an invalid fiat rate");
    }

    return setCached(key, rate);
  } catch (error) {
    console.error(`FIAT RATE PROVIDER FAILURE (${fromCurrency}/${toCurrency}):`, error.message);
    if (error instanceof RateProviderError) {
      throw error;
    }
    throw new RateProviderError("Fiat rate provider returned an invalid rate", error);
  }
};

const getCryptoUsdPrices = async () => {
  const key = "CRYPTO_USD_PRICES";
  const cachedPrices = getCached(key);

  if (cachedPrices !== null) {
    return cachedPrices;
  }

  try {
    const data = await fetchJson(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd"
    );
    const prices = {
      BTC: Number(data.bitcoin?.usd),
      USDT: Number(data.tether?.usd),
    };

    if (
      !Number.isFinite(prices.BTC) ||
      prices.BTC <= 0 ||
      !Number.isFinite(prices.USDT) ||
      prices.USDT <= 0
    ) {
      throw new Error("Provider returned invalid crypto prices");
    }

    return setCached(key, prices);
  } catch (error) {
    console.error("CRYPTO RATE PROVIDER FAILURE:", error.message);
    if (error instanceof RateProviderError) {
      throw error;
    }
    throw new RateProviderError("Crypto rate provider returned invalid prices", error);
  }
};

const getUsdRate = async (currency) => {
  if (currency === "USD") {
    return 1;
  }

  if (FIAT_CURRENCIES.has(currency)) {
    return getFiatRate(currency, "USD");
  }

  const prices = await getCryptoUsdPrices();
  return prices[currency];
};

const getLiveRate = async (fromCurrency, toCurrency) => {
  const from = String(fromCurrency || "").toUpperCase();
  const to = String(toCurrency || "").toUpperCase();

  if (!SUPPORTED_CURRENCIES.has(from) || !SUPPORTED_CURRENCIES.has(to)) {
    throw new Error("Exchange pair is not supported");
  }

  if (from === to) {
    return 1;
  }

  const pairKey = `${from}_${to}`;
  const cachedRate = getCached(pairKey);

  if (cachedRate !== null) {
    return cachedRate;
  }

  let rate;

  if (FIAT_CURRENCIES.has(from) && FIAT_CURRENCIES.has(to)) {
    rate = await getFiatRate(from, to);
  } else {
    const fromUsd = await getUsdRate(from);
    const toUsd = await getUsdRate(to);
    rate = fromUsd / toUsd;
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new RateProviderError("Live rate calculation returned an invalid rate");
  }

  return setCached(pairKey, rate);
};

module.exports = {
  FIAT_CURRENCIES,
  SUPPORTED_CURRENCIES,
  RateProviderError,
  getLiveRate,
};