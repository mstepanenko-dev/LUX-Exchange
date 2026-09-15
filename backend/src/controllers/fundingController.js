const prisma = require("../lib/prisma");
const { createPortfolioSnapshot } = require("../services/portfolioService");

const SUPPORTED_CURRENCIES = new Set(["GBP", "EUR", "USD", "USDT", "BTC"]);

const parseFundingRequest = (body) => ({
  currency: String(body.currency || "").toUpperCase(),
  amount: Number(body.amount),
});

const validateFundingRequest = ({ currency, amount }) =>
  SUPPORTED_CURRENCIES.has(currency) && Number.isFinite(amount) && amount > 0;

const deposit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const request = parseFundingRequest(req.body);

    if (!validateFundingRequest(request)) {
      return res.status(400).json({
        success: false,
        message: "Invalid funding request",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
          currency: request.currency,
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: request.amount } },
      });
      const transaction = await tx.fundingTransaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          currency: request.currency,
          amount: request.amount,
          status: "COMPLETED",
        },
      });

      return { updatedWallet, transaction };
    });

    try {
      await createPortfolioSnapshot(userId);
    } catch (snapshotError) {
      console.error("DEPOSIT SNAPSHOT ERROR:", snapshotError);
    }

    return res.json({
      success: true,
      message: "Deposit completed",
      wallet: result.updatedWallet,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("DEPOSIT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete deposit",
    });
  }
};

const withdraw = async (req, res) => {
  try {
    const userId = req.user.userId;
    const request = parseFundingRequest(req.body);

    if (!validateFundingRequest(request)) {
      return res.status(400).json({
        success: false,
        message: "Invalid funding request",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
          currency: request.currency,
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    if (Number(wallet.balance) < request.amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: request.amount } },
      });
      const transaction = await tx.fundingTransaction.create({
        data: {
          userId,
          type: "WITHDRAWAL",
          currency: request.currency,
          amount: request.amount,
          status: "COMPLETED",
        },
      });

      return { updatedWallet, transaction };
    });

    try {
      await createPortfolioSnapshot(userId);
    } catch (snapshotError) {
      console.error("WITHDRAWAL SNAPSHOT ERROR:", snapshotError);
    }

    return res.json({
      success: true,
      message: "Withdrawal completed",
      wallet: result.updatedWallet,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("WITHDRAWAL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete withdrawal",
    });
  }
};

const getFundingHistory = async (req, res) => {
  try {
    const transactions = await prisma.fundingTransaction.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, transactions });
  } catch (error) {
    console.error("FUNDING HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load funding history",
    });
  }
};

module.exports = {
  deposit,
  withdraw,
  getFundingHistory,
};