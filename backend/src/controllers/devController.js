const prisma = require("../lib/prisma");

const clearPortfolioHistory = async (req, res) => {
  try {
    await prisma.portfolioSnapshot.deleteMany({
      where: { userId: req.user.userId },
    });

    return res.json({
      success: true,
      message: "Portfolio history cleared",
    });
  } catch (error) {
    console.error("CLEAR PORTFOLIO HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to clear portfolio history",
    });
  }
};

module.exports = {
  clearPortfolioHistory,
};