const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const WALLET_CURRENCIES = ["GBP", "EUR", "USD", "USDT", "BTC"];

const createToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "7d" }
  );

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  wallets: user.wallets,
});

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,

        wallets: {
          create: WALLET_CURRENCIES.map((currency) => ({
            currency,
            balance: 0,
          })),
        },
      },

      include: {
        wallets: true,
      },
    });

    return res.status(201).json({
      success: true,
      user: publicUser(user),
      token: createToken(user.id),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = email
      ? await prisma.user.findUnique({
          where: { email },
          include: {
            wallets: true,
          },
        })
      : null;

    if (
      !user ||
      !password ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.json({
      success: true,
      user: publicUser(user),
      token: createToken(user.id),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

module.exports = {
  register,
  login,
};