const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const exchangeRoutes = require("./routes/exchangeRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const portfolioHistoryRoutes = require("./routes/portfolioHistoryRoutes");
const fundingRoutes = require("./routes/fundingRoutes");
const devRoutes = require("./routes/devRoutes");
const cryptoWalletRoutes = require("./routes/cryptoWalletRoutes");
const profileRoutes = require("./routes/profileRoutes");
const paymentMethodRoutes = require("./routes/paymentMethodRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/portfolio/history", portfolioHistoryRoutes);
app.use("/api/funding", fundingRoutes);
app.use("/api/crypto-wallets", cryptoWalletRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api", exchangeRoutes);
if (process.env.NODE_ENV !== "production") {
  app.use("/api/dev", devRoutes);
}

app.get("/", (req, res) => {
  res.json({
    name: "LUX Exchange API",
    status: "running",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LUX Exchange API running on http://localhost:${PORT}`);
});