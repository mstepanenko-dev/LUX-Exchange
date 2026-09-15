const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getPortfolio } = require("../controllers/portfolioController");

const router = express.Router();

router.get("/", authMiddleware, getPortfolio);

module.exports = router;