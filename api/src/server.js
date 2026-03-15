const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const multipart = require("@fastify/multipart");
const { customAlphabet } = require("nanoid");
const mime = require("mime-types");
const config = require("./config");
const { pool, ensureSchema } = require("./db");
const fileStore = require("./fileStore");
const { ensureUploadDir, saveFileStream } = require("./storage");
const { sanitizeFilename, toExpiryDate, hashValue, isExpired } = require("./utils");

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 20);
const app = Fastify({ logger: true });

async function serializeTransfer(transferId) {
  let transfer;
  let files;
  if (config.dataDriver === "file") {
    transfer = await fileStore.getTransferById(transferId);
    files = await fileStore.getFilesByTransferId(transferId);
  } else {
    [[transfer]] = await pool.query("SELECT * FROM transfers WHERE id = ?", [transferId]);
    [files] = await pool.query(
      "SELECT id, original_name, mime_type, size_bytes, created_at FROM transfer_files WHERE transfer_id = ? ORDER BY id ASC",
      [transferId]
    );
  }

  return {
    token: transfer.public_token,
    slug: transfer.slug,
    status: isExpired(transfer) ? "expired" : transfer.status,
    totalSize: transfer.total_size,
    fileCount: transfer.file_count,
    expiresAt: transfer.expires_at,
    downloadLimit: transfer.download_limit,
    downloadCount: transfer.download_count,
    hasPassword: Boolean(transfer.password_hash),
    message: transfer.message,
    files: files.map((file) => ({
      id: file.id,
      name: file.original_name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      createdAt: file.created_at
    }))
  };
}

app.register(cors, { origin: true });
app.register(multipart, {
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
    files: 20
  }
});

app.get("/health", async () => ({ status: "ok" }));

app.post("/transfers", async (request, reply) => {
  const token = nanoid();
  const slug = token.toLowerCase();
  const fields = {
    expirationPreset: "7d",
    password: "",
    downloadLimit: "",
    message: ""
  };
  const filesToInsert = [];
  const transferFolder = path.join(config.uploadDir, token);

  await fs.promises.mkdir(transferFolder, { recursive: true });

  for await (const part of request.parts()) {
    if (part.type === "file") {
      if (!part.filename) {
        continue;
      }

      const safeName = sanitizeFilename(part.filename);
      const storedName = `${Date.now()}-${safeName}`;
      const destination = path.join(transferFolder, storedName);
      const stat = await saveFileStream(part.file, destination);

      filesToInsert.push({
        originalName: part.filename,
        storedName,
        storedPath: destination,
        mimeType: part.mimetype || mime.lookup(part.filename) || "application/octet-stream",
        sizeBytes: stat.size
      });
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  if (!filesToInsert.length) {
    return reply.code(400).send({ message: "Aucun fichier recu." });
  }

  const expiresAt = toExpiryDate(fields.expirationPreset);
  const passwordHash = fields.password
    ? await bcrypt.hash(fields.password, config.bcryptRounds)
    : null;
  const totalSize = filesToInsert.reduce((sum, file) => sum + file.sizeBytes, 0);
  const downloadLimit = fields.downloadLimit ? Number(fields.downloadLimit) : null;
  const ipHash = hashValue(request.ip);
  const userAgentHash = hashValue(request.headers["user-agent"]);

  try {
    let transferId;
    if (config.dataDriver === "file") {
      transferId = await fileStore.createTransfer({
        token,
        slug,
        totalSize,
        files: filesToInsert,
        expiresAt,
        downloadLimit,
        passwordHash,
        message: fields.message,
        ipHash,
        userAgentHash
      });
    } else {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [result] = await connection.query(
          `INSERT INTO transfers
           (public_token, slug, status, total_size, file_count, expires_at, download_limit, password_hash, message, ip_hash, user_agent_hash)
           VALUES (?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            token,
            slug,
            totalSize,
            filesToInsert.length,
            expiresAt,
            downloadLimit,
            passwordHash,
            fields.message || null,
            ipHash,
            userAgentHash
          ]
        );

        for (const file of filesToInsert) {
          await connection.query(
            `INSERT INTO transfer_files
             (transfer_id, original_name, stored_name, stored_path, mime_type, size_bytes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              result.insertId,
              file.originalName,
              file.storedName,
              file.storedPath,
              file.mimeType,
              file.sizeBytes
            ]
          );
        }

        await connection.query(
          "INSERT INTO transfer_events (transfer_id, event_type, meta_json) VALUES (?, 'transfer_created', JSON_OBJECT('fileCount', ?, 'totalSize', ?))",
          [result.insertId, filesToInsert.length, totalSize]
        );
        await connection.commit();
        transferId = result.insertId;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    const transfer = await serializeTransfer(transferId);
    return reply.code(201).send({
      message: "Lien cristallise.",
      transfer,
      shareUrl: `${config.appBaseUrl}/d/${token}`
    });
  } catch (error) {
    throw error;
  }
});

app.get("/transfers/:token", async (request, reply) => {
  const transfer = config.dataDriver === "file"
    ? await fileStore.getTransferByToken(request.params.token)
    : (await pool.query("SELECT * FROM transfers WHERE public_token = ?", [request.params.token]))[0][0];

  if (!transfer) {
    return reply.code(404).send({ message: "Transfert introuvable." });
  }

  return reply.send(await serializeTransfer(transfer.id));
});

app.post("/transfers/:token/verify", async (request, reply) => {
  const transfer = config.dataDriver === "file"
    ? await fileStore.getTransferByToken(request.params.token)
    : (await pool.query("SELECT * FROM transfers WHERE public_token = ?", [request.params.token]))[0][0];

  if (!transfer) {
    return reply.code(404).send({ message: "Transfert introuvable." });
  }
  if (!transfer.password_hash) {
    return reply.send({ ok: true });
  }

  const password = request.body && request.body.password;
  const isValid = await bcrypt.compare(password || "", transfer.password_hash);
  if (!isValid) {
    return reply.code(401).send({ message: "Mot de passe invalide." });
  }

  return reply.send({ ok: true });
});

app.get("/download/:token/:fileId", async (request, reply) => {
  const transfer = config.dataDriver === "file"
    ? await fileStore.getTransferByToken(request.params.token)
    : (await pool.query("SELECT * FROM transfers WHERE public_token = ?", [request.params.token]))[0][0];

  if (!transfer) {
    return reply.code(404).send({ message: "Transfert introuvable." });
  }
  if (isExpired(transfer)) {
    return reply.code(410).send({ message: "Transfert expire." });
  }

  if (transfer.download_limit && transfer.download_count >= transfer.download_limit) {
    return reply.code(410).send({ message: "Limite de telechargements atteinte." });
  }

  if (transfer.password_hash) {
    const password = request.query.password || "";
    const isValid = await bcrypt.compare(password, transfer.password_hash);
    if (!isValid) {
      return reply.code(401).send({ message: "Mot de passe requis." });
    }
  }

  const file = config.dataDriver === "file"
    ? await fileStore.getFileById(transfer.id, request.params.fileId)
    : (await pool.query("SELECT * FROM transfer_files WHERE id = ? AND transfer_id = ?", [
        request.params.fileId,
        transfer.id
      ]))[0][0];

  if (!file) {
    return reply.code(404).send({ message: "Fichier introuvable." });
  }

  if (config.dataDriver === "file") {
    await fileStore.incrementDownloadCount(transfer.id, file.id);
  } else {
    await pool.query("UPDATE transfers SET download_count = download_count + 1 WHERE id = ?", [transfer.id]);
    await pool.query(
      "INSERT INTO transfer_events (transfer_id, event_type, meta_json) VALUES (?, 'file_downloaded', JSON_OBJECT('fileId', ?))",
      [transfer.id, file.id]
    );
  }

  reply.header("Content-Type", file.mime_type || "application/octet-stream");
  reply.header("Content-Disposition", `attachment; filename="${encodeURIComponent(file.original_name)}"`);
  return reply.send(fs.createReadStream(file.stored_path));
});

async function start() {
  await ensureUploadDir();
  if (config.dataDriver === "file") {
    await fileStore.ensureDataFile();
  } else {
    await ensureSchema();
  }
  await app.listen({ port: config.port, host: "0.0.0.0" });
}

start().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
