const prisma = require("../lib/prisma");

const SAFE_PAYMENT_METHOD_FIELDS = {
  id: true,
  type: true,
  brand: true,
  last4: true,
  cardholderName: true,
  expiryMonth: true,
  expiryYear: true,
  isDefault: true,
  isDemo: true,
  createdAt: true,
};

const getUserId = (req) => req.user.userId;

const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: getUserId(req) },
      orderBy: { createdAt: "desc" },
      select: SAFE_PAYMENT_METHOD_FIELDS,
    });

    return res.json({ success: true, paymentMethods });
  } catch (error) {
    console.error("GET PAYMENT METHODS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load payment methods",
    });
  }
};

const validateDemoCard = (body) => {
  const cardholderName = String(body.cardholderName || "").trim();
  const brand = String(body.brand || "").trim();
  const last4 = String(body.last4 || "").trim();
  const expiryMonth = Number(body.expiryMonth);
  const expiryYear = Number(body.expiryYear);
  const currentYear = new Date().getFullYear();

  if (!cardholderName || cardholderName.length > 100) {
    return { message: "Cardholder name is required and must be 100 characters or fewer" };
  }
  if (!["Visa", "Mastercard"].includes(brand)) {
    return { message: "Card brand must be Visa or Mastercard" };
  }
  if (!/^\d{4}$/.test(last4)) {
    return { message: "Last 4 digits must be exactly four numbers" };
  }
  if (!Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) {
    return { message: "Expiry month must be between 1 and 12" };
  }
  if (!Number.isInteger(expiryYear) || expiryYear < currentYear || expiryYear > currentYear + 20) {
    return { message: "Expiry year must be a reasonable future year" };
  }

  return { cardholderName, brand, last4, expiryMonth, expiryYear };
};

const addDemoCard = async (req, res) => {
  try {
    const validation = validateDemoCard(req.body || {});
    if (validation.message) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const userId = getUserId(req);
    const existingCount = await prisma.paymentMethod.count({ where: { userId } });
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId,
        type: "CARD",
        brand: validation.brand,
        last4: validation.last4,
        cardholderName: validation.cardholderName,
        expiryMonth: validation.expiryMonth,
        expiryYear: validation.expiryYear,
        isDefault: existingCount === 0,
        // Demo records intentionally contain display metadata only: never PAN/CVV.
        isDemo: true,
      },
      select: SAFE_PAYMENT_METHOD_FIELDS,
    });

    return res.status(201).json({ success: true, paymentMethod });
  } catch (error) {
    console.error("ADD DEMO CARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to add demo card",
    });
  }
};

const setDefaultPaymentMethod = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    const userId = getUserId(req);
    const paymentMethod = await prisma.paymentMethod.findFirst({ where: { id, userId } });
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.paymentMethod.update({
        where: { id },
        data: { isDefault: true },
        select: SAFE_PAYMENT_METHOD_FIELDS,
      });
    });

    return res.json({ success: true, paymentMethod: updated });
  } catch (error) {
    console.error("SET DEFAULT PAYMENT METHOD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to set default payment method" });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    const userId = getUserId(req);
    const paymentMethod = await prisma.paymentMethod.findFirst({ where: { id, userId } });
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentMethod.delete({ where: { id } });
      if (paymentMethod.isDefault) {
        const newestRemaining = await tx.paymentMethod.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        if (newestRemaining) {
          await tx.paymentMethod.update({ where: { id: newestRemaining.id }, data: { isDefault: true } });
        }
      }
    });

    return res.json({ success: true, message: "Payment method removed" });
  } catch (error) {
    console.error("DELETE PAYMENT METHOD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to remove payment method" });
  }
};

module.exports = {
  getPaymentMethods,
  addDemoCard,
  setDefaultPaymentMethod,
  deletePaymentMethod,
};