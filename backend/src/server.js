const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const exchangeRoutes = require("./routes/exchangeRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const fundingRoutes = require("./routes/fundingRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/funding", fundingRoutes);
app.use("/api", exchangeRoutes);

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