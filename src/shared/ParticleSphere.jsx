import React, { useRef, useEffect } from 'react';

const ParticleSphere = ({
    size = 300,
    isActive = false,
    isHovered = false,
    isSpeaking = false,
    isListening = false,
    showBorder = true
}) => {
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

        // DIFFERENTIATED Volumetric Configuration
        // Inner: Slow/Steady | Middle: Active/Flow | Outer: Slowest/Drifting
        const layers = [
            { count: 120, radius: 0.30, speed: 0.35, opacity: 0.75, size: 2.2, color: '#22d3ee', influence: 0.4 }, // Stable Core
            { count: 110, radius: 0.50, speed: 0.45, opacity: 0.60, size: 1.8, color: '#0ea5e9', influence: 0.6 }, // Inner Shell
            { count: 120, radius: 0.70, speed: 0.85, opacity: 0.45, size: 1.5, color: '#2563eb', influence: 0.9 }, // Mid Shell
            { count: 90, radius: 0.88, speed: 0.30, opacity: 0.25, size: 1.4, color: '#6366f1', influence: 0.3 }, // Outer Shell
            { count: 70, radius: 0.98, speed: 0.22, opacity: 0.15, size: 3.0, color: '#7c3aed', influence: 0.2 }  // Edge Haze
        ];

        const particles = [];
        let time = 0;
        let audioWave = 0;
        let audioPhase = 0;

        // Shared noise field for coordinated fluid motion
        const getFieldVector = (x, y, z, offset) => {
            const scale = 0.008;
            const t = offset * 0.4;
            const n1 = Math.sin(x * scale + t) * Math.cos(y * scale + t);
            const n2 = Math.sin(y * scale + t) * Math.cos(z * scale + t);
            const n3 = Math.sin(z * scale + t) * Math.cos(x * scale + t);
            return { x: n1 * 8, y: n2 * 8, z: n3 * 8 };
        };

        // Initialize particles across all layers
        layers.forEach((layer, layerIndex) => {
            for (let i = 0; i < layer.count; i++) {
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos((Math.random() * 2) - 1);
                // Perfect Sphere Radius Initialization (Zero variation for geometric precision)
                const r = (size * 0.48) * layer.radius;

                // Sophisticated Palette: Electric Blue, Deep Cyan, and Authoritative Deep Violet
                particles.push({
                    baseX: r * Math.sin(phi) * Math.cos(theta),
                    baseY: r * Math.sin(phi) * Math.sin(theta),
                    baseZ: r * Math.cos(phi),
                    size: layer.size * (0.8 + Math.random() * 0.4),
                    color: layer.color,
                    layerIndex,
                    layerSpeed: layer.speed,
                    layerOpacity: layer.opacity,
                    layerInfluence: layer.influence,
                    orbitPhase: Math.random() * Math.PI * 2,
                    noiseVariation: Math.random() * 500
                });
            }
        });

        let animationFrameId;

        const animate = () => {
            // Clear completely for a clean, sharp silhouette
            ctx.clearRect(0, 0, size, size);

            const centerX = size / 2;
            const centerY = size / 2;

            // Accelerated time progression for more energetic/quite faster feel
            time += 0.0055;

            // Extremely subtle audio-reactive wave simulation
            if (isSpeaking || isListening) {
                audioPhase += 0.04;
                const baseWave = Math.sin(audioPhase) * 0.5 + 0.5;
                const secondaryWave = Math.sin(audioPhase * 1.3 + 0.8) * 0.2 + 0.4;
                // Capped at 12% fluctuation for extreme subtlety
                audioWave = (baseWave * 0.8 + secondaryWave * 0.2) * 0.12;
            } else {
                audioWave *= 0.98;
                audioPhase = 0;
            }

            // Purposive, slow rotation timing for a confident feel
            const fieldOffset = time * 0.5;

            // Fluid life modulation - multi-sine wave for more natural breathing
            const lifeCycle = Math.sin(time * 0.07) * 0.5 + 0.5;
            const primaryBreath = Math.sin(time * 0.1) * 0.02;
            const secondaryBreath = Math.sin(time * 0.23) * 0.005;
            const breathIntensity = 1 + primaryBreath + secondaryBreath;
            const brightnessMod = 0.82 + (lifeCycle * 0.18);

            // Calculate overall flow translation
            const flowOffset = time * 0.4;

            // Project and sort for volumetric rendering
            const projected = particles.map(p => {
                const layerRot = time * p.layerSpeed * (p.layerIndex % 2 === 0 ? 1 : -1);

                // Shared Flow Field sampling with layer-specific influence
                const field = getFieldVector(p.baseX, p.baseY, p.baseZ, fieldOffset + p.noiseVariation * 0.01);

                // Differentiated motion: Stable inner, Active middle, Drifting outer
                const posX = p.baseX + (field.x * p.layerInfluence);
                const posY = p.baseY + (field.y * p.layerInfluence);
                const posZ = p.baseZ + (field.z * p.layerInfluence) + (audioWave * size * 0.08);

                // 3D Orbital Rotation with subtle parallax
                const cosY = Math.cos(layerRot);
                const sinY = Math.sin(layerRot);
                const tilt = 0.4;
                const cosX = Math.cos(tilt);
                const sinX = Math.sin(tilt);

                let x1 = posX * cosY - posZ * sinY;
                let z1 = posZ * cosY + posX * sinY;
                let y2 = posY * cosX - z1 * sinX;
                let z2 = z1 * cosX + posY * sinX;

                const perspective = 800; // Flatter perspective for airy feel
                const scale = (perspective / (perspective + z2)) * breathIntensity;

                return {
                    x: x1 * scale + centerX,
                    y: y2 * scale + centerY,
                    z: z2,
                    scale,
                    alpha: p.layerOpacity,
                    color: p.color,
                    size: p.size,
                    layer: p.layerIndex
                };
            }).sort((a, b) => a.z - b.z);

            // Draw Shared Energy Core
            projected.forEach(p => {
                if (p.z < -600) return;

                const layerStep = p.layerIndex * 0.45;
                const layerShimmer = 0.85 + Math.sin(time * 0.12 + layerStep) * 0.15;

                const depthFactor = (p.z + size) / (size * 2);
                const alpha = Math.max(0.01, Math.min(0.9, depthFactor * p.alpha * brightnessMod * layerShimmer));
                const finalSize = p.size * p.scale * (1 + audioWave);

                // Volumetric Render
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, finalSize * 3);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, p.color + '00');

                ctx.fillStyle = gradient;
                ctx.globalAlpha = alpha * 0.45;
                ctx.beginPath();
                ctx.arc(p.x, p.y, finalSize * 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, finalSize, 0, Math.PI * 2);
                ctx.fill();

                // Surface Glint for depth
                if (p.z > size * 0.2 && Math.random() > 0.99) {
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = alpha * 0.3;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, finalSize * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Stabilizing Energy Boundary (Only if requested)
            if (showBorder) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, size * 0.495, 0, Math.PI * 2);
                const borderGrad = ctx.createLinearGradient(0, 0, size, size);
                borderGrad.addColorStop(0, 'rgba(34, 211, 238, 0.15)');
                borderGrad.addColorStop(1, 'rgba(124, 58, 237, 0.1)');
                ctx.strokeStyle = borderGrad;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.6 * brightnessMod;
                ctx.stroke();
            }

            // Ambient Spherical Glow - Highly translucent for completely open feel
            const ambient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.48);
            ambient.addColorStop(0, `rgba(14, 165, 233, ${0.08 * brightnessMod})`);
            ambient.addColorStop(0.8, `rgba(37, 99, 235, ${0.02 * brightnessMod})`);
            ambient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = ambient;
            ctx.globalAlpha = (isSpeaking || isListening) ? 0.22 + audioWave : 0.15;
            ctx.arc(centerX, centerY, size * 0.48, 0, Math.PI * 2);
            ctx.fill();

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [size, isActive, isHovered, isSpeaking, isListening, showBorder]);

    return <canvas ref={canvasRef} style={{ display: 'block' }} />;
};

export default ParticleSphere;
