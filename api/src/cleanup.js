const config = require("./config");
const { pool } = require("./db");
const fileStore = require("./fileStore");
const { removeFileIfExists } = require("./storage");

async function cleanupExpiredTransfers() {
  if (config.dataDriver === "file") {
    await fileStore.deleteExpiredTransfers();
    return;
  }

  const [transfers] = await pool.query(
    "SELECT id FROM transfers WHERE expires_at <= NOW() OR status = 'expired'"
  );

  for (const transfer of transfers) {
    const [files] = await pool.query("SELECT stored_path FROM transfer_files WHERE transfer_id = ?", [
      transfer.id
    ]);
    for (const file of files) {
      await removeFileIfExists(file.stored_path);
    }
    await pool.query("DELETE FROM transfers WHERE id = ?", [transfer.id]);
  }

  await pool.end();
}

cleanupExpiredTransfers().catch((error) => {
  console.error(error);
  process.exit(1);
});
