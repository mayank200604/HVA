import React, { useRef, useEffect } from 'react';

const ParticleSphere = ({ size = 300 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas resolution for HDPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Particles config
        const particleCount = 200;
        const particles = [];
        let rotation = 0;

        // Init particles
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos((Math.random() * 2) - 1);
            const radius = (size / 2.5); // Slightly smaller than container

            particles.push({
                x: radius * Math.sin(phi) * Math.cos(theta),
                y: radius * Math.sin(phi) * Math.sin(theta),
                z: radius * Math.cos(phi),
                baseX: radius * Math.sin(phi) * Math.cos(theta),
                baseY: radius * Math.sin(phi) * Math.sin(theta),
                baseZ: radius * Math.cos(phi),
                size: Math.random() * 1.5 + 0.5,
                color: Math.random() > 0.5 ? '#22d3ee' : '#a78bfa' // Cyan or Violet
            });
        }

        let animationFrameId;

        const animate = () => {
            ctx.clearRect(0, 0, size, size);

            const centerX = size / 2;
            const centerY = size / 2;

            rotation += 0.003;

            particles.forEach(p => {
                // Rotate around Y axis
                const cosY = Math.cos(rotation);
                const sinY = Math.sin(rotation);

                // Rotate around X axis (slight tilt)
                const tilt = 0.2;
                const cosX = Math.cos(tilt);
                const sinX = Math.sin(tilt);

                // 3D Rotation Calculation
                // 1. Rotate Y
                let x1 = p.baseX * cosY - p.baseZ * sinY;
                let z1 = p.baseZ * cosY + p.baseX * sinY;

                // 2. Rotate X (Tilt)
                let y2 = p.baseY * cosX - z1 * sinX;
                let z2 = z1 * cosX + p.baseY * sinX;

                // Simple projection
                const scale = 250 / (250 + z2); // Perspective
                const x2d = x1 * scale + centerX;
                const y2d = y2 * scale + centerY;

                // Draw particle
                ctx.beginPath();
                const alpha = Math.max(0.1, (z2 + size / 2) / size); // Depth-based opacity
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [size]);

    return <canvas ref={canvasRef} />;
};

export default ParticleSphere;
