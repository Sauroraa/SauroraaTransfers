const path = require("path");

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  port: toNumber(process.env.PORT, 8080),
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost",
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, "../../storage/uploads"),
  dataDriver: process.env.DATA_DRIVER || "mysql",
  fileDbPath: process.env.FILE_DB_PATH || path.resolve(__dirname, "../../storage/data/transfers.json"),
  bcryptRounds: toNumber(process.env.BCRYPT_ROUNDS, 10),
  maxFileSizeMb: toNumber(process.env.MAX_FILE_SIZE_MB, 2048),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: toNumber(process.env.DB_PORT, 3306),
    database: process.env.DB_NAME || "sauroraa_transfers",
    user: process.env.DB_USER || "sauroraa",
    password: process.env.DB_PASSWORD || "change-me"
  }
};
