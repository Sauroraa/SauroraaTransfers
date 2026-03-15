import { useRef, useState } from "react";
import AuroraBackground from "../components/AuroraBackground.jsx";
import SignalField from "../components/SignalField.jsx";
import { uploadTransfer } from "../lib/api.js";

export default function HomePage() {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");
  const [options, setOptions] = useState({
    expirationPreset: "7d",
    password: "",
    downloadLimit: "",
    message: ""
  });

  const totalSizeLabel = `${(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)} MB`;

  const mergeFiles = (incoming) => {
    setFiles((current) => [...current, ...incoming]);
    setError("");
    setShareUrl("");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    mergeFiles(Array.from(event.dataTransfer.files));
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError("Ajoute au moins un fichier pour lancer le transfert.");
      return;
    }

    setPhase("prepare");
    setProgress(8);
    setError("");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    Object.entries(options).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    try {
      setPhase("upload");
      const result = await uploadTransfer(formData, (value) => {
        setProgress(Math.max(10, value));
      });
      setPhase("finalize");
      setProgress(96);
      window.setTimeout(() => {
        setPhase("done");
        setProgress(100);
        setShareUrl(result.shareUrl);
      }, 350);
    } catch (uploadError) {
      setError(uploadError.message);
      setPhase("idle");
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setShareUrl("");
    setProgress(0);
    setPhase("idle");
    setError("");
  };

  return (
    <main
      className="page-shell"
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <AuroraBackground />
      <SignalField energy={progress + (isDragging ? 24 : 0)} />
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={(event) => mergeFiles(Array.from(event.target.files || []))}
      />

      <header className="simple-topbar">
        <div className="brand-mark">Sa</div>
        <div className="topbar-card">
          <span>Direct upload</span>
          <span>Unique link</span>
          <span>No account</span>
        </div>
      </header>

      <section className="simple-home">
        <section className="signal-stage">
          <div className="hero-badge hero-badge-left">
            <span className="hero-badge-label">Transmission</span>
            <strong>{phase === "idle" ? "En attente" : phase}</strong>
          </div>
          <div className="hero-badge hero-badge-right">
            <span className="hero-badge-label">Volume</span>
            <strong>{totalSizeLabel}</strong>
          </div>

          <div className="hero-copy-block">
            <span className="eyebrow dark">SauroraaTransfers</span>
            <h1>Deposez vos fichiers dans un signal vivant.</h1>
            <p>
              Une seule page, un noyau central, un lien net. L’interface reagit a votre geste et
              transforme chaque envoi en mouvement.
            </p>
          </div>

          <div className={`upload-card signal-card ${isDragging ? "dragging" : ""}`}>
            <div className="core-glow core-glow-one" aria-hidden="true" />
            <div className="core-glow core-glow-two" aria-hidden="true" />

            <div className="upload-card-top">
              <button type="button" className="upload-picker" onClick={() => fileInputRef.current?.click()}>
                Ajouter des fichiers
              </button>
              <button type="button" className="upload-picker muted" onClick={handleReset}>
                Reinitialiser
              </button>
            </div>

            <div className="upload-stats">
              <span>{files.length} fichier(s)</span>
              <span>{totalSizeLabel}</span>
            </div>

            <div className="mini-dropzone" onClick={() => fileInputRef.current?.click()}>
              <strong>Glissez vos fichiers ici</strong>
              <small>Le noyau absorbe le depot et prepare votre lien.</small>
            </div>

            <div className="file-mini-list">
              {files.length ? (
                files.map((file) => (
                  <div className="file-mini-row" key={`${file.name}-${file.lastModified}`}>
                    <div>
                      <strong>{file.name}</strong>
                      <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((current) => current.filter((currentFile) => currentFile !== file))
                      }
                    >
                      Retirer
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-copy">Ajoutez vos fichiers pour lancer le signal.</p>
              )}
            </div>

            <div className="compact-fields">
              <label>
                Expiration
                <select
                  value={options.expirationPreset}
                  onChange={(event) =>
                    setOptions((current) => ({ ...current, expirationPreset: event.target.value }))
                  }
                >
                  <option value="24h">24 heures</option>
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                </select>
              </label>
              <label>
                Mot de passe
                <input
                  type="password"
                  value={options.password}
                  onChange={(event) =>
                    setOptions((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Optionnel"
                />
              </label>
              <label>
                Message
                <textarea
                  rows="3"
                  value={options.message}
                  onChange={(event) =>
                    setOptions((current) => ({ ...current, message: event.target.value }))
                  }
                  placeholder="Ajouter un message"
                />
              </label>
            </div>

            <div className="upload-footer">
              <div className="progress-inline">
                <span>{phase === "idle" ? "Pret" : phase}</span>
                <strong>{progress}%</strong>
              </div>
              <button type="button" className="launch-button full" onClick={handleUpload}>
                Generer un lien
              </button>
            </div>

            {shareUrl ? (
              <div className="success-panel">
                <span className="eyebrow dark">Lien cristallise</span>
                <p>{shareUrl}</p>
                <div className="success-actions">
                  <button
                    type="button"
                    className="upload-picker"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                  >
                    Copier le lien
                  </button>
                  <button type="button" className="upload-picker muted" onClick={handleReset}>
                    Nouvel envoi
                  </button>
                </div>
              </div>
            ) : null}

            {error ? <div className="inline-error">{error}</div> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
