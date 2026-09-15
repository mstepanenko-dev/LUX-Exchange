const prisma = require("../lib/prisma");

const RANGE_DURATIONS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const getPortfolioHistory = async (req, res) => {
  const range = String(req.query.range || "24h").toLowerCase();

  if (range !== "all" && !RANGE_DURATIONS[range]) {
    return res.status(400).json({
      success: false,
      message: "Unsupported portfolio history range",
    });
  }

  try {
    const createdAt = range === "all"
      ? undefined
      : { gte: new Date(Date.now() - RANGE_DURATIONS[range]) };
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        userId: req.user.userId,
        ...(createdAt ? { createdAt } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: { totalGBP: true, createdAt: true },
    });

    return res.json({
      success: true,
      range,
      baseCurrency: "GBP",
      snapshots: snapshots.map((snapshot) => ({
        totalGBP: Number(snapshot.totalGBP),
        createdAt: snapshot.createdAt,
      })),
    });
  } catch (error) {
    console.error("PORTFOLIO HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load portfolio history",
    });
  }
};

module.exports = {
  getPortfolioHistory,
};