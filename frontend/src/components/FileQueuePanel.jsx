export default function FileQueuePanel({ files, onRemove }) {
  if (!files.length) {
    return null;
  }

  const totalSizeMb = (files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2);

  return (
    <aside className="glass-panel queue-panel">
      <div className="queue-heading">
        <span>Queue intelligente</span>
        <strong>{files.length} fichier(s)</strong>
      </div>
      <div className="queue-list">
        {files.map((file) => (
          <div className="queue-item" key={`${file.name}-${file.lastModified}`}>
            <div>
              <strong>{file.name}</strong>
              <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
            </div>
            <button type="button" onClick={() => onRemove(file)}>
              Retirer
            </button>
          </div>
        ))}
      </div>
      <div className="queue-total">Volume total: {totalSizeMb} MB</div>
    </aside>
  );
}

