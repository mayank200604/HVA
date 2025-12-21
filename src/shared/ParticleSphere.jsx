import React, { useEffect, useRef } from "react";

export default function ParticleSphere({ size = 280 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const particles = [];
    const count = 420;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      particles.push({ phi, theta, radius: size * 0.33 });
    }

    let t = 0;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    function draw() {
      t += 0.004;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2);

      for (const p of particles) {
        const theta = p.theta + t * 2;
        const phi = p.phi + Math.sin(t * 2 + p.theta) * 0.05;

        const r = p.radius;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        const scale = 0.7 + (z / (r * 2));
        const alpha = 0.3 + scale * 0.7;

        ctx.beginPath();
        ctx.arc(x, y, 1.1 + scale * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(163, 230, 255, ${alpha})`;
        ctx.fill();
      }

      ctx.restore();
      requestAnimationFrame(draw);
    }

    draw();
  }, [size]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-full bg-slate-950/40"
      />
      <div className="pointer-events-none absolute inset-6 rounded-full bg-[radial-gradient(circle,_#22d3ee22,_transparent_70%)] blur-xl" />
    </div>
  );
}
