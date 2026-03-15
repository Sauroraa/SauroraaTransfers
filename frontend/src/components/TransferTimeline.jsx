const steps = [
  { key: "idle", label: "Depot dans le flux" },
  { key: "prepare", label: "Preparation" },
  { key: "upload", label: "Transmission" },
  { key: "finalize", label: "Cristallisation" },
  { key: "done", label: "Lien genere" }
];

export default function TransferTimeline({ phase, progress }) {
  const activeIndex = steps.findIndex((step) => step.key === phase);

  return (
    <div className="glass-panel timeline-panel">
      <div className="timeline-head">
        <span>Trajectoire cosmique</span>
        <strong>{progress}%</strong>
      </div>
      <div className="timeline-list">
        {steps.map((step, index) => (
          <div className={`timeline-step ${index <= activeIndex ? "active" : ""}`} key={step.key}>
            <span className="timeline-node" />
            <div>
              <strong>{step.label}</strong>
              <small>{index <= activeIndex ? "Actif" : "En attente"}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

