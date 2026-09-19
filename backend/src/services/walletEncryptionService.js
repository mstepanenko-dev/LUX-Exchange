const crypto = require("crypto");

const encryptionSecret = process.env.WALLET_ENCRYPTION_KEY;

if (!encryptionSecret || encryptionSecret.length < 32) {
  throw new Error("WALLET_ENCRYPTION_KEY must be set and at least 32 characters long");
}

const encryptionKey = crypto.createHash("sha256").update(encryptionSecret).digest();
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const encryptPrivateKey = (privateKey) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
};

const decryptPrivateKey = (encryptedValue) => {
  const [ivValue, authTagValue, encryptedValueBase64] = encryptedValue.split(".");
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, Buffer.from(ivValue, "base64"));
  decipher.setAuthTag(Buffer.from(authTagValue, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValueBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");
};

module.exports = {
  encryptPrivateKey,
  decryptPrivateKey,
};