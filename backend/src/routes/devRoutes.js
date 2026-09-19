const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { clearPortfolioHistory } = require("../controllers/devController");

const router = express.Router();

router.delete("/portfolio-history", authMiddleware, clearPortfolioHistory);

module.exports = router;