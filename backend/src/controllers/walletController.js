const prisma = require("../lib/prisma");

const getWallets = async (req, res) => {
  try {
    const userId = req.user.userId;

    const wallets = await prisma.wallet.findMany({
      where: {
        userId,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.json({
      success: true,
      wallets,
    });
  } catch (error) {
    console.error("GET WALLETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallets",
    });
  }
};

module.exports = {
  getWallets,
};