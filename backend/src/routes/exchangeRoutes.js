const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getRates,
  exchange,
  getTransactions,
} = require("../controllers/exchangeController");

const router = express.Router();

router.get("/rates", authMiddleware, getRates);
router.post("/exchange", authMiddleware, exchange);
router.get("/transactions", authMiddleware, getTransactions);

module.exports = router;