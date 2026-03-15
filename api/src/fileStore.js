const fs = require("fs");
const path = require("path");
const config = require("./config");
const { removeFileIfExists } = require("./storage");

const defaultState = {
  lastTransferId: 0,
  lastFileId: 0,
  transfers: [],
  files: [],
  events: []
};

async function ensureDataFile() {
  await fs.promises.mkdir(path.dirname(config.fileDbPath), { recursive: true });
  try {
    await fs.promises.access(config.fileDbPath);
  } catch {
    await fs.promises.writeFile(config.fileDbPath, JSON.stringify(defaultState, null, 2));
  }
}

async function readState() {
  await ensureDataFile();
  const raw = await fs.promises.readFile(config.fileDbPath, "utf8");
  return JSON.parse(raw);
}

async function writeState(state) {
  await fs.promises.writeFile(config.fileDbPath, JSON.stringify(state, null, 2));
}

async function createTransfer(payload) {
  const state = await readState();
  const transferId = ++state.lastTransferId;
  const createdAt = new Date().toISOString();
  const transfer = {
    id: transferId,
    public_token: payload.token,
    slug: payload.slug,
    status: "ready",
    total_size: payload.totalSize,
    file_count: payload.files.length,
    expires_at: payload.expiresAt.toISOString(),
    download_limit: payload.downloadLimit,
    download_count: 0,
    password_hash: payload.passwordHash,
    message: payload.message || null,
    created_at: createdAt,
    updated_at: createdAt,
    ip_hash: payload.ipHash,
    user_agent_hash: payload.userAgentHash
  };

  state.transfers.push(transfer);

  const files = payload.files.map((file) => {
    const fileId = ++state.lastFileId;
    return {
      id: fileId,
      transfer_id: transferId,
      original_name: file.originalName,
      stored_name: file.storedName,
      stored_path: file.storedPath,
      mime_type: file.mimeType,
      size_bytes: file.sizeBytes,
      created_at: createdAt
    };
  });
  state.files.push(...files);
  state.events.push({
    id: state.events.length + 1,
    transfer_id: transferId,
    event_type: "transfer_created",
    meta_json: {
      fileCount: payload.files.length,
      totalSize: payload.totalSize
    },
    created_at: createdAt
  });

  await writeState(state);
  return transferId;
}

async function getTransferByToken(token) {
  const state = await readState();
  return state.transfers.find((item) => item.public_token === token) || null;
}

async function getTransferById(id) {
  const state = await readState();
  return state.transfers.find((item) => item.id === id) || null;
}

async function getFilesByTransferId(transferId) {
  const state = await readState();
  return state.files.filter((item) => item.transfer_id === transferId);
}

async function getFileById(transferId, fileId) {
  const state = await readState();
  return state.files.find((item) => item.transfer_id === transferId && String(item.id) === String(fileId)) || null;
}

async function incrementDownloadCount(transferId, fileId) {
  const state = await readState();
  const transfer = state.transfers.find((item) => item.id === transferId);
  if (transfer) {
    transfer.download_count += 1;
    transfer.updated_at = new Date().toISOString();
  }
  state.events.push({
    id: state.events.length + 1,
    transfer_id: transferId,
    event_type: "file_downloaded",
    meta_json: { fileId },
    created_at: new Date().toISOString()
  });
  await writeState(state);
}

async function deleteExpiredTransfers() {
  const state = await readState();
  const now = Date.now();
  const expiredIds = state.transfers
    .filter((transfer) => new Date(transfer.expires_at).getTime() <= now || transfer.status === "expired")
    .map((transfer) => transfer.id);

  const expiredFiles = state.files.filter((file) => expiredIds.includes(file.transfer_id));
  for (const file of expiredFiles) {
    await removeFileIfExists(file.stored_path);
  }

  state.transfers = state.transfers.filter((transfer) => !expiredIds.includes(transfer.id));
  state.files = state.files.filter((file) => !expiredIds.includes(file.transfer_id));
  state.events = state.events.filter((event) => !expiredIds.includes(event.transfer_id));
  await writeState(state);
}

module.exports = {
  ensureDataFile,
  createTransfer,
  getTransferByToken,
  getTransferById,
  getFilesByTransferId,
  getFileById,
  incrementDownloadCount,
  deleteExpiredTransfers
};

