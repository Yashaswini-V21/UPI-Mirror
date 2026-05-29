import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NeuralParticlesCanvas = ({ progress }: { progress: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
    }[] = [];

    const colors = ['#a855f7', '#06b6d4', '#22c55e', '#3b82f6'];
    const maxParticles = 120;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const render = () => {
      ctx.fillStyle = 'rgba(3, 4, 10, 0.08)'; // Deep space trail
      ctx.fillRect(0, 0, width, height);

      // Centroid gravity based on loading progress
      const cx = width / 2;
      const cy = height / 2;
      const gravityForce = (progress / 100) * 0.025;

      particles.forEach((p) => {
        // Apply center gravity pull as progress increments
        if (progress > 10) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 10) {
            p.vx += (dx / dist) * gravityForce;
            p.vy += (dy / dist) * gravityForce;
          }
        }

        // Limit speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = 3.5;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce/Wrap boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // Connect near particles with lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw faint perspective digital grids in background
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.015)';
      ctx.lineWidth = 0.5;
      const step = 80;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  );
};

export const SplashScreen: React.FC = () => {
  const [percent, setPercent] = useState(0);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);

  const bootLogs = [
    "[BOOT] Ingesting Kira-AI cognitive kernel v3.0.0...",
    "[LOAD] Syncing LangGraph multi-agent orchestration streams...",
    "[PII] Masking UPI data space with one-way SHA-256 signatures...",
    "[CORE] Initializing runway forecasting regression models...",
    "[NUDG] Bootstrapping behavioral finance nudges generator...",
    "[WIDG] Preloading web-artifacts-builder rendering nodes...",
    "[SYS] Kira-AI interface compiled successfully. Standby for launch."
  ];

  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(loadingInterval);
          return 100;
        }
        const step = Math.floor(Math.random() * 10) + 4;
        return Math.min(100, prev + step);
      });
    }, 110);

    return () => clearInterval(loadingInterval);
  }, []);

  useEffect(() => {
    let timerId: any;
    const runLogs = (index: number) => {
      if (index >= bootLogs.length) return;
      setActiveLogs((prev) => {
        const next = [...prev, bootLogs[index]];
        if (next.length > 5) next.shift(); // Keep last 5 logs
        return next;
      });

      const delay = index === bootLogs.length - 1 ? 500 : Math.random() * 200 + 150;
      timerId = setTimeout(() => runLogs(index + 1), delay);
    };

    runLogs(0);
    return () => clearTimeout(timerId);
  }, []);

  const logoPathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (custom: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: custom * 0.12, duration: 1.4, ease: "easeInOut" },
        opacity: { delay: custom * 0.12, duration: 0.25 },
      },
    }),
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, #070a16 0%, #03040a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        overflow: 'hidden',
      }}
    >
      {/* Dynamic interactive particle canvas background */}
      <NeuralParticlesCanvas progress={percent} />

      {/* Aurora visual glow blobs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          width: '70vw',
          height: '70vw',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18), transparent 70%)',
          filter: 'blur(130px)',
          zIndex: 2,
        }}
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          position: 'absolute',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.16), transparent 70%)',
          filter: 'blur(110px)',
          zIndex: 2,
        }}
      />

      {/* Main container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          width: '100%',
          maxWidth: '460px',
          padding: '0 24px',
        }}
      >
        {/* Orbital concentric circles + logo loader */}
        <div
          style={{
            width: '240px',
            height: '240px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Ring 1 - Outermost (Cyan rotating dashed) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
            style={{
              position: 'absolute',
              width: '230px',
              height: '230px',
              border: '1.5px dashed rgba(6, 182, 212, 0.4)',
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)',
            }}
          />

          {/* Ring 2 - Middle (Purple double bordered segments) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
            style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              border: '2px solid transparent',
              borderTopColor: 'rgba(168, 85, 247, 0.55)',
              borderBottomColor: 'rgba(168, 85, 247, 0.55)',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.12)',
            }}
          />

          {/* Ring 3 - Innermost (Green pulsing dots) */}
          <motion.div
            animate={{ rotate: 180 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            style={{
              position: 'absolute',
              width: '170px',
              height: '170px',
              border: '2px dotted rgba(34, 197, 94, 0.45)',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.1)',
            }}
          />

          {/* Glowing central core orb */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(168, 85, 247, 0.25)',
                '0 0 45px rgba(168, 85, 247, 0.5)',
                '0 0 20px rgba(168, 85, 247, 0.25)',
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          />

          {/* 3D Vector Logo inside loading orbit */}
          <div style={{ width: '100px', height: '100px', position: 'relative' }}>
            <svg
              viewBox="0 0 100 100"
              style={{
                width: '100%',
                height: '100%',
                filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.65))',
              }}
            >
              {/* Outer diamond */}
              <motion.path
                d="M 50 12 L 88 50 L 50 88 L 12 50 Z"
                fill="none"
                stroke="#a855f7"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                custom={1}
                variants={logoPathVariants}
                initial="hidden"
                animate="visible"
              />
              {/* Dashed connector grid lines */}
              <motion.path
                d="M 50 12 L 50 88 M 12 50 L 88 50"
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                custom={2}
                variants={logoPathVariants}
                initial="hidden"
                animate="visible"
              />
              {/* Inner glowing core diamond */}
              <motion.path
                d="M 50 28 L 72 50 L 50 72 L 28 50 Z"
                fill="rgba(6, 182, 212, 0.06)"
                stroke="#06b6d4"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                custom={3}
                variants={logoPathVariants}
                initial="hidden"
                animate="visible"
              />
              {/* Pulsing center green core */}
              <motion.circle
                cx="50"
                cy="50"
                r="7"
                fill="#22c55e"
                animate={{
                  scale: [0.85, 1.45, 0.85],
                  opacity: [0.75, 1, 0.75],
                  shadow: '0 0 15px #22c55e',
                }}
                transition={{ duration: 1.3, repeat: Infinity }}
              />
            </svg>
          </div>

          {/* Central percentage indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '38px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              fontWeight: 800,
              color: '#f4f7ff',
              textShadow: '0 0 10px rgba(255,255,255,0.4)',
              letterSpacing: '1px',
            }}
          >
            {percent}%
          </div>
        </div>

        {/* Brand visual header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {Array.from("KIRA-AI").map((char, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.3, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.07, type: 'spring', stiffness: 150, damping: 12 }}
                style={{
                  fontSize: '46px',
                  fontWeight: 900,
                  background:
                    char === '-'
                      ? 'linear-gradient(135deg, #22c55e, #10b981)'
                      : 'linear-gradient(135deg, #ffffff 0%, #c084fc 40%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: '0.06em',
                  filter: 'drop-shadow(0 0 25px rgba(168, 85, 247, 0.4))',
                  display: 'inline-block',
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 0.7 }}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: 'rgba(244, 247, 255, 0.9)',
              letterSpacing: '5px',
              textTransform: 'uppercase',
              marginTop: '4px',
            }}
          >
            Behavioral Finance Intelligence
          </motion.div>
        </div>

        {/* Digital Boot Terminal Box at bottom */}
        <div
          style={{
            width: '100%',
            background: 'rgba(3, 4, 10, 0.92)',
            border: '1px solid rgba(168, 85, 247, 0.22)',
            borderRadius: '16px',
            padding: '18px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10.5px',
            color: 'rgba(255, 255, 255, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            textAlign: 'left',
            boxShadow:
              '0 12px 40px rgba(0,0,0,0.85), inset 0 0 20px rgba(168,85,247,0.04)',
          }}
        >
          {activeLogs.map((log, index) => (
            <motion.div
              key={index + log}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                color: log.includes('[BOOT]')
                  ? 'rgba(255,255,255,0.85)'
                  : log.includes('[SYS]')
                  ? '#22c55e'
                  : log.includes('[WIDG]')
                  ? '#a855f7'
                  : log.includes('[PII]')
                  ? '#06b6d4'
                  : 'rgba(255,255,255,0.5)',
              }}
            >
              {log}
            </motion.div>
          ))}
          {activeLogs.length < 5 && (
            <span
              style={{
                animation: 'blink 1s infinite',
                color: '#a855f7',
                fontWeight: 'bold',
              }}
            >
              _
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
