const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getPortfolioHistory,
} = require("../controllers/portfolioHistoryController");

const router = express.Router();

router.get("/", authMiddleware, getPortfolioHistory);

module.exports = router;