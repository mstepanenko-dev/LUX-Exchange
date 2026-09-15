const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  deposit,
  withdraw,
  getFundingHistory,
} = require("../controllers/fundingController");

const router = express.Router();

router.post("/deposit", authMiddleware, deposit);
router.post("/withdraw", authMiddleware, withdraw);
router.get("/history", authMiddleware, getFundingHistory);

module.exports = router;