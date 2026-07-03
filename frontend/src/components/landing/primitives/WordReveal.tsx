/**
 * landing/primitives/WordReveal.tsx
 * ────────────────────────────────────
 * Staggered word-by-word reveal animation.
 */
import React from 'react';
import { motion } from 'framer-motion';

interface WordRevealProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}

export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  className = '',
  style = {},
  delay = 0,
}) => {
  const words = text.split(' ');
  return (
    <span
      className={className}
      style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', ...style }}
    >
      {words.map((word, idx) => (
        <span key={idx} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.22em' }}>
          <motion.span
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: delay + idx * 0.06 }}
            style={{ display: 'inline-block' }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
};
