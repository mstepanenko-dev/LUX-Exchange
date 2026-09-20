const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getPaymentMethods,
  addDemoCard,
  setDefaultPaymentMethod,
  deletePaymentMethod,
} = require("../controllers/paymentMethodController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getPaymentMethods);
router.post("/demo-card", addDemoCard);
router.post("/:id/default", setDefaultPaymentMethod);
router.delete("/:id", deletePaymentMethod);

module.exports = router;