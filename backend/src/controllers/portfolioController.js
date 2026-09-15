const prisma = require("../lib/prisma");
const {
  RateProviderError,
  getLiveRate,
} = require("../services/rateService");

const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.userId;
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { id: "asc" },
    });

    const assets = await Promise.all(
      wallets.map(async (wallet) => {
        const balance = Number(wallet.balance);
        const rateToGBP = wallet.currency === "GBP"
          ? 1
          : await getLiveRate(wallet.currency, "GBP");

        return {
          currency: wallet.currency,
          balance,
          rateToGBP,
          valueGBP: balance * rateToGBP,
        };
      })
    );

    const totalGBP = assets.reduce((total, asset) => total + asset.valueGBP, 0);

    return res.json({
      success: true,
      baseCurrency: "GBP",
      totalGBP,
      assets,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof RateProviderError) {
      return res.status(503).json({
        success: false,
        message: "Portfolio valuation is temporarily unavailable",
      });
    }

    console.error("PORTFOLIO ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load portfolio valuation",
    });
  }
};

module.exports = {
  getPortfolio,
};