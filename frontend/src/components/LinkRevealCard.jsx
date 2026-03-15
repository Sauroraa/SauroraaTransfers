export default function LinkRevealCard({ shareUrl, onReset }) {
  if (!shareUrl) {
    return null;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <section className="glass-panel link-card">
      <span className="eyebrow">Lien cristallise</span>
      <h2>Votre portail est pret.</h2>
      <p>{shareUrl}</p>
      <div className="link-actions">
        <button type="button" className="primary-button" onClick={handleCopy}>
          Copier le lien
        </button>
        <button type="button" className="secondary-button" onClick={onReset}>
          Nouvel envoi
        </button>
      </div>
    </section>
  );
}

