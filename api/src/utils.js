const crypto = require("crypto");

const expirationMap = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000
};

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toExpiryDate(preset) {
  const delta = expirationMap[preset] || expirationMap["7d"];
  return new Date(Date.now() + delta);
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value || "").digest("hex");
}

function isExpired(transfer) {
  return new Date(transfer.expires_at).getTime() <= Date.now();
}

module.exports = {
  sanitizeFilename,
  toExpiryDate,
  hashValue,
  isExpired
};

