const prisma = require("../lib/prisma");
const {
  SUPPORTED_CURRENCIES,
  RateProviderError,
  getLiveRate,
} = require("../services/rateService");

const FEE_PERCENT = 0.5;

const getRates = async (req, res) => {
  try {
    const currencies = [...SUPPORTED_CURRENCIES];
    const rates = {};

    await Promise.all(
      currencies.map(async (fromCurrency) => {
        rates[fromCurrency] = {};

        await Promise.all(
          currencies
            .filter((toCurrency) => toCurrency !== fromCurrency)
            .map(async (toCurrency) => {
              rates[fromCurrency][toCurrency] = await getLiveRate(
                fromCurrency,
                toCurrency
              );
            })
        );
      })
    );

    return res.json({
      success: true,
      feePercent: FEE_PERCENT,
      rates,
      source: "live",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof RateProviderError) {
      return res.status(503).json({
        success: false,
        message: "Live exchange rates are temporarily unavailable",
      });
    }

    console.error("RATES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load exchange rates",
    });
  }
};

const exchange = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fromCurrency, toCurrency, amount } = req.body;
    const normalizedFromCurrency = String(fromCurrency || "").toUpperCase();
    const normalizedToCurrency = String(toCurrency || "").toUpperCase();

    const numericAmount = Number(amount);

    if (
      !SUPPORTED_CURRENCIES.has(normalizedFromCurrency) ||
      !SUPPORTED_CURRENCIES.has(normalizedToCurrency) ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid exchange request",
      });
    }

    if (normalizedFromCurrency === normalizedToCurrency) {
      return res.status(400).json({
        success: false,
        message: "Currencies must be different",
      });
    }

    let rate;
    try {
      rate = await getLiveRate(normalizedFromCurrency, normalizedToCurrency);
    } catch (error) {
      if (error instanceof RateProviderError) {
        return res.status(503).json({
          success: false,
          message: "Live exchange rates are temporarily unavailable",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Exchange pair is not supported",
      });
    }

    const fromWallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
            currency: normalizedFromCurrency,
        },
      },
    });

    const toWallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
            currency: normalizedToCurrency,
        },
      },
    });

    if (!fromWallet || !toWallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const currentBalance = Number(fromWallet.balance);

    if (currentBalance < numericAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const fee = numericAmount * (FEE_PERCENT / 100);
    const amountAfterFee = numericAmount - fee;
    const receivedAmount = amountAfterFee * rate;

    const result = await prisma.$transaction(async (tx) => {
      const updatedFromWallet = await tx.wallet.update({
        where: {
          id: fromWallet.id,
        },
        data: {
          balance: {
            decrement: numericAmount,
          },
        },
      });

      const updatedToWallet = await tx.wallet.update({
        where: {
          id: toWallet.id,
        },
        data: {
          balance: {
            increment: receivedAmount,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          fromCurrency: normalizedFromCurrency,
          toCurrency: normalizedToCurrency,
          fromAmount: numericAmount,
          toAmount: receivedAmount,
          exchangeRate: rate,
          fee,
          status: "COMPLETED",
        },
      });

      return {
        updatedFromWallet,
        updatedToWallet,
        transaction,
      };
    });

    return res.json({
      success: true,
      message: "Exchange completed",
      data: result,
    });
  } catch (error) {
    console.error("EXCHANGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete exchange",
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("TRANSACTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load transactions",
    });
  }
};

module.exports = {
  getRates,
  exchange,
  getTransactions,
};