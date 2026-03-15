import { useEffect, useRef } from "react";

export default function SignalField({ energy = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: 0, y: 0, active: false };

    const particles = Array.from({ length: 78 }, (_, index) => ({
      angle: (Math.PI * 2 * index) / 78,
      radius: 120 + Math.random() * 260,
      speed: 0.0016 + Math.random() * 0.0024,
      size: 1 + Math.random() * 3.6,
      drift: Math.random() * 30
    }));

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const onPointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const draw = (time) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const pulse = 0.5 + Math.sin(time * 0.0012) * 0.5;
      const boost = 1 + energy * 0.008;

      context.clearRect(0, 0, width, height);

      const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.42);
      glow.addColorStop(0, `rgba(93, 132, 255, ${0.16 + pulse * 0.1})`);
      glow.addColorStop(0.45, "rgba(62, 87, 184, 0.14)");
      glow.addColorStop(1, "rgba(10, 17, 40, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      particles.forEach((particle, index) => {
        particle.angle += particle.speed * boost;
        const wobble = Math.sin(time * 0.001 + particle.drift) * 18;
        const px = centerX + Math.cos(particle.angle + index * 0.03) * (particle.radius + wobble);
        const py = centerY + Math.sin(particle.angle * 1.12 + index * 0.02) * (particle.radius * 0.44 + wobble);

        if (pointer.active) {
          const dx = pointer.x - px;
          const dy = pointer.y - py;
          const distance = Math.hypot(dx, dy);
          if (distance < 180) {
            context.beginPath();
            context.moveTo(px, py);
            context.lineTo(pointer.x, pointer.y);
            context.strokeStyle = `rgba(132, 162, 255, ${0.06 + (180 - distance) / 2800})`;
            context.lineWidth = 1;
            context.stroke();
          }
        }

        context.beginPath();
        context.arc(px, py, particle.size + pulse * 0.4, 0, Math.PI * 2);
        context.fillStyle = index % 3 === 0 ? "rgba(230, 238, 255, 0.78)" : "rgba(111, 146, 255, 0.48)";
        context.fill();
      });

      context.beginPath();
      context.arc(centerX, centerY, 158 + pulse * 6, 0, Math.PI * 2);
      context.strokeStyle = "rgba(122, 153, 255, 0.18)";
      context.lineWidth = 1.2;
      context.stroke();

      context.beginPath();
      context.arc(centerX, centerY, 218 + pulse * 10, 0, Math.PI * 2);
      context.strokeStyle = "rgba(255, 255, 255, 0.09)";
      context.lineWidth = 1;
      context.stroke();

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [energy]);

  return <canvas ref={canvasRef} className="signal-field" aria-hidden="true" />;
}

