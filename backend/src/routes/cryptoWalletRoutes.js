const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getCryptoWallets,
  createBtcTestnet4Wallet,
  getBtcTestnet4Status,
} = require("../controllers/cryptoWalletController");

const router = express.Router();

router.get("/", authMiddleware, getCryptoWallets);
router.get("/btc-testnet4/status", authMiddleware, getBtcTestnet4Status);
router.post("/btc-testnet", authMiddleware, createBtcTestnet4Wallet);
router.post("/btc-testnet4", authMiddleware, createBtcTestnet4Wallet);

module.exports = router;