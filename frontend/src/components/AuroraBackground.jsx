import { useEffect } from "react";

export default function AuroraBackground() {
  useEffect(() => {
    const updatePointer = (event) => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    };

    window.addEventListener("pointermove", updatePointer);
    return () => window.removeEventListener("pointermove", updatePointer);
  }, []);

  return (
    <div className="aurora-shell" aria-hidden="true">
      <div className="aurora-gradient aurora-gradient-one" />
      <div className="aurora-gradient aurora-gradient-two" />
      <div className="aurora-gradient aurora-gradient-three" />
      <div className="noise-layer" />
    </div>
  );
}

