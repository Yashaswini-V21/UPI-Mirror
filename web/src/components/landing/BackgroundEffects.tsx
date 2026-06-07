/**
 * landing/BackgroundEffects.tsx
 * ──────────────────────────────
 * Ambient background: starfield + parallax grid + radial blobs + noise.
 */
import React from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import { C } from './DesignTokens';
import { Starfield } from './Starfield';

interface BackgroundEffectsProps {
  scrollYProgress: MotionValue<number>;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ scrollYProgress }) => {
  const gridY = useTransform(scrollYProgress, [0, 0.5], [0, 35]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: C.bg,
      }}
    >
      <Starfield />

      {/* Perspective grid */}
      <motion.div
        style={{
          position: 'absolute',
          width: '300%',
          height: '300%',
          top: '-100%',
          left: '-100%',
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
            linear-gradient(90deg,rgba(99,102,241,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
          transform: 'perspective(500px) rotateX(68deg)',
          y: gridY,
          maskImage: 'radial-gradient(circle at center, black 18%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 18%, transparent 70%)',
        }}
      />

      {/* Radial blobs */}
      <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '45vw', height: '45vw', background: 'radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)', filter: 'blur(90px)', animation: 'kira-drift 28s infinite alternate ease-in-out' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle,rgba(236,72,153,0.09),transparent 70%)', filter: 'blur(90px)', animation: 'kira-drift 24s infinite alternate-reverse ease-in-out' }} />
      <div style={{ position: 'absolute', top: '40%', left: '20%', width: '35vw', height: '35vw', background: 'radial-gradient(circle,rgba(20,184,166,0.07),transparent 70%)', filter: 'blur(100px)', animation: 'kira-drift 32s infinite alternate ease-in-out' }} />

      {/* Film grain overlay */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15, mixBlendMode: 'overlay' }}>
        <filter id="nz">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={4} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#nz)" />
      </svg>
    </div>
  );
};
