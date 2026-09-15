const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getWallets } = require("../controllers/walletController");

const router = express.Router();

router.get("/", authMiddleware, getWallets);

module.exports = router;