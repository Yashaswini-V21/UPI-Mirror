/**
 * landing/primitives/MagneticButton.tsx
 * ───────────────────────────────────────
 * Button that magnetically follows cursor position.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  'aria-label'?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  style = {},
  onClick,
  className = '',
  'aria-label': label,
}) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.35 });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      style={{ display: 'inline-block' }}
    >
      <motion.button
        onClick={onClick}
        aria-label={label}
        className={className}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        style={{ position: 'relative', cursor: 'pointer', border: 'none', outline: 'none', background: 'none', ...style }}
      >
        {children}
      </motion.button>
    </div>
  );
};
