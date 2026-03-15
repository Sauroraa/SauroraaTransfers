import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AuroraBackground from "../components/AuroraBackground.jsx";
import { downloadUrl, fetchTransfer, verifyTransfer } from "../lib/api.js";

export default function DownloadPage() {
  const { token } = useParams();
  const [transfer, setTransfer] = useState(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransfer(token)
      .then((data) => {
        setTransfer(data);
        setStatus("ready");
      })
      .catch((loadError) => {
        setError(loadError.message);
        setStatus("error");
      });
  }, [token]);

  const handleUnlock = async () => {
    try {
      await verifyTransfer(token, password);
      setStatus("unlocked");
      setError("");
    } catch (unlockError) {
      setError(unlockError.message);
    }
  };

  const canDownload = status === "unlocked" || (transfer && !transfer.hasPassword);

  return (
    <main className="page-shell download-shell">
      <AuroraBackground />
      <section className="download-card glass-panel">
        <span className="eyebrow">Portail de reception</span>
        {status === "loading" ? <h1>Chargement du transfert...</h1> : null}
        {status === "error" ? <h1>{error}</h1> : null}
        {transfer ? (
          <>
            <h1>Ouvrir le portail</h1>
            <p>
              {transfer.fileCount} fichier(s), expiration le{" "}
              {new Date(transfer.expiresAt).toLocaleString("fr-FR")}
            </p>
            {transfer.message ? <p className="download-message">{transfer.message}</p> : null}

            {transfer.hasPassword && !canDownload ? (
              <div className="password-gate">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mot de passe requis"
                />
                <button type="button" className="primary-button" onClick={handleUnlock}>
                  Debloquer
                </button>
              </div>
            ) : null}

            {error && status !== "error" ? <div className="error-card">{error}</div> : null}

            <div className="download-list">
              {transfer.files.map((file) => (
                <a
                  key={file.id}
                  className={`download-item ${canDownload ? "" : "disabled"}`}
                  href={canDownload ? downloadUrl(token, file.id, password) : undefined}
                >
                  <div>
                    <strong>{file.name}</strong>
                    <small>{(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</small>
                  </div>
                  <span>Telecharger</span>
                </a>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

