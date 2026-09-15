const prisma = require("../lib/prisma");
const { getLiveRate } = require("./rateService");

const SNAPSHOT_MIN_INTERVAL_MS = 5 * 60 * 1000;
const MATERIAL_CHANGE_ABSOLUTE_GBP = 0.01;
const MATERIAL_CHANGE_PERCENT = 0.001;

const calculatePortfolioValue = async (userId) => {
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

  return {
    totalGBP: assets.reduce((total, asset) => total + asset.valueGBP, 0),
    assets,
    updatedAt: new Date().toISOString(),
  };
};

const shouldCreateSnapshot = (latestSnapshot, totalGBP) => {
  if (!latestSnapshot) {
    return true;
  }

  const latestTotal = Number(latestSnapshot.totalGBP);
  const elapsed = Date.now() - latestSnapshot.createdAt.getTime();
  const difference = Math.abs(totalGBP - latestTotal);
  const relativeDifference = latestTotal === 0
    ? difference
    : difference / Math.abs(latestTotal);

  return elapsed >= SNAPSHOT_MIN_INTERVAL_MS ||
    difference >= MATERIAL_CHANGE_ABSOLUTE_GBP ||
    relativeDifference >= MATERIAL_CHANGE_PERCENT;
};

const createPortfolioSnapshot = async (userId, portfolio) => {
  const currentPortfolio = portfolio || await calculatePortfolioValue(userId);
  const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!shouldCreateSnapshot(latestSnapshot, currentPortfolio.totalGBP)) {
    return latestSnapshot;
  }

  return prisma.portfolioSnapshot.create({
    data: {
      userId,
      totalGBP: currentPortfolio.totalGBP,
    },
  });
};

module.exports = {
  calculatePortfolioValue,
  createPortfolioSnapshot,
};