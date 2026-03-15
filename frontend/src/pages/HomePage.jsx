import { useMemo, useRef, useState } from "react";
import AuroraBackground from "../components/AuroraBackground.jsx";
import FileQueuePanel from "../components/FileQueuePanel.jsx";
import LinkRevealCard from "../components/LinkRevealCard.jsx";
import TransferTimeline from "../components/TransferTimeline.jsx";
import UploadOrb from "../components/UploadOrb.jsx";
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

  const totalSizeLabel = useMemo(() => {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    return `${(total / 1024 / 1024).toFixed(2)} MB`;
  }, [files]);

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
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={(event) => mergeFiles(Array.from(event.target.files || []))}
      />

      <section className="hero-layout">
        <div className="hero-copy">
          <span className="eyebrow">SauroraaTransfers</span>
          <h2>Traversez une aurore numerique pour partager vos fichiers massifs.</h2>
          <p>
            L’interface entiere devient votre zone de depot. Glissez, envoyez, recevez un lien net
            et immediat, sans creer de compte.
          </p>
          <div className="metric-row">
            <div className="glass-panel metric-card">
              <strong>{files.length}</strong>
              <span>Elements dans le flux</span>
            </div>
            <div className="glass-panel metric-card">
              <strong>{totalSizeLabel}</strong>
              <span>Volume embarque</span>
            </div>
          </div>
        </div>

        <div className="hero-orb-wrap">
          <UploadOrb
            isDragging={isDragging}
            progress={progress}
            onBrowse={() => fileInputRef.current?.click()}
          />
          <button type="button" className="launch-button" onClick={handleUpload}>
            Deposer dans le flux
          </button>
        </div>
      </section>

      <section className="control-grid">
        <FileQueuePanel
          files={files}
          onRemove={(fileToRemove) =>
            setFiles((current) => current.filter((file) => file !== fileToRemove))
          }
        />

        <div className="glass-panel option-panel">
          <span className="eyebrow">Parametres avances</span>
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
            Mot de passe optionnel
            <input
              type="password"
              value={options.password}
              onChange={(event) =>
                setOptions((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="Laisser vide pour acces libre"
            />
          </label>
          <label>
            Limite de telechargements
            <input
              type="number"
              min="1"
              value={options.downloadLimit}
              onChange={(event) =>
                setOptions((current) => ({ ...current, downloadLimit: event.target.value }))
              }
              placeholder="Illimite"
            />
          </label>
          <label>
            Message joint
            <textarea
              rows="4"
              value={options.message}
              onChange={(event) =>
                setOptions((current) => ({ ...current, message: event.target.value }))
              }
              placeholder="Ajouter un contexte pour le destinataire"
            />
          </label>
        </div>

        <TransferTimeline phase={phase} progress={progress} />
      </section>

      <LinkRevealCard shareUrl={shareUrl} onReset={handleReset} />
      {error ? <div className="glass-panel error-card">{error}</div> : null}
    </main>
  );
}

