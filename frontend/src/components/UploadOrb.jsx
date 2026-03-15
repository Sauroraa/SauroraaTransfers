import { motion } from "framer-motion";

export default function UploadOrb({ isDragging, progress, onBrowse }) {
  return (
    <motion.div
      className={`upload-orb ${isDragging ? "dragging" : ""}`}
      animate={{
        scale: isDragging ? 1.04 : 1,
        boxShadow: isDragging
          ? "0 0 120px rgba(57, 255, 199, 0.38)"
          : "0 0 70px rgba(64, 183, 255, 0.22)"
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="orb-core" />
      <div className="orb-ring orb-ring-one" />
      <div className="orb-ring orb-ring-two" />
      <div className="orb-content">
        <span className="eyebrow">Aurora Stream</span>
        <h1>Envoyez vos fichiers dans le flux.</h1>
        <p>Prive, rapide, sans compte, dans une interface qui reagit a chaque depot.</p>
        <button type="button" className="primary-button" onClick={onBrowse}>
          Choisir un fichier
        </button>
        <div className="orb-progress">
          <span>Transmission</span>
          <strong>{progress}%</strong>
        </div>
      </div>
    </motion.div>
  );
}

