const {
  RateProviderError,
} = require("../services/rateService");
const {
  calculatePortfolioValue,
  createPortfolioSnapshot,
} = require("../services/portfolioService");

const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.userId;
    const portfolio = await calculatePortfolioValue(userId);
    try {
      await createPortfolioSnapshot(userId, portfolio);
    } catch (snapshotError) {
      console.error("PORTFOLIO SNAPSHOT ERROR:", snapshotError);
    }

    return res.json({
      success: true,
      baseCurrency: "GBP",
      ...portfolio,
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