const prisma = require("../lib/prisma");
const { createBitcoinTestnet4Wallet } = require("../services/bitcoinTestnetService");
const { encryptPrivateKey } = require("../services/walletEncryptionService");
const { getAddressStatus } = require("../services/mempoolTestnet4Service");

const CURRENCY = "BTC";
const NETWORK = "bitcoin-testnet4";

const publicWallet = (wallet) => ({
  currency: wallet.currency,
  network: wallet.network,
  address: wallet.address,
});

const getCryptoWallets = async (req, res) => {
  try {
    const wallets = await prisma.cryptoWallet.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "asc" },
      select: { currency: true, network: true, address: true },
    });

    return res.json({
      success: true,
      wallets,
    });
  } catch (error) {
    console.error("GET CRYPTO WALLETS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load crypto wallets" });
  }
};

const createBtcTestnet4Wallet = async (req, res) => {
  try {
    const existingWallet = await prisma.cryptoWallet.findUnique({
      where: {
        userId_currency_network: {
          userId: req.user.userId,
          currency: CURRENCY,
          network: NETWORK,
        },
      },
    });

    if (existingWallet) {
      return res.json({ success: true, wallet: publicWallet(existingWallet) });
    }

    const generatedWallet = createBitcoinTestnet4Wallet();
    const wallet = await prisma.cryptoWallet.create({
      data: {
        userId: req.user.userId,
        currency: CURRENCY,
        network: NETWORK,
        address: generatedWallet.address,
        encryptedKey: encryptPrivateKey(generatedWallet.privateKey),
      },
    });

    return res.status(201).json({ success: true, wallet: publicWallet(wallet) });
  } catch (error) {
    console.error("CREATE BTC TESTNET4 WALLET ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to create Bitcoin Testnet4 wallet" });
  }
};

const getBtcTestnet4Status = async (req, res) => {
  try {
    const wallet = await prisma.cryptoWallet.findUnique({
      where: {
        userId_currency_network: {
          userId: req.user.userId,
          currency: CURRENCY,
          network: NETWORK,
        },
      },
      select: { currency: true, network: true, address: true },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Bitcoin Testnet4 wallet not found",
      });
    }

    const blockchainStatus = await getAddressStatus(wallet.address);

    return res.json({
      success: true,
      wallet,
      ...blockchainStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET BTC TESTNET4 STATUS ERROR:", error.message);
    return res.status(503).json({
      success: false,
      message: "Bitcoin Testnet4 data is temporarily unavailable.",
    });
  }
};

module.exports = {
  getCryptoWallets,
  createBtcTestnet4Wallet,
  getBtcTestnet4Status,
};