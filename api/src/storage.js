const fs = require("fs");
const { pipeline } = require("stream/promises");
const config = require("./config");

async function ensureUploadDir() {
  await fs.promises.mkdir(config.uploadDir, { recursive: true });
}

async function saveFileStream(stream, destination) {
  await fs.promises.mkdir(require("path").dirname(destination), { recursive: true });
  await pipeline(stream, fs.createWriteStream(destination));
  return fs.promises.stat(destination);
}

async function removeFileIfExists(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

module.exports = {
  ensureUploadDir,
  saveFileStream,
  removeFileIfExists
};

