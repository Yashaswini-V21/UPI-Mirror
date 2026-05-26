import React from 'react';
import { motion } from 'framer-motion';
import { criticalPulse } from './variants';

export interface StatusBadgeProps {
  status: 'stable' | 'watch' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { padding: '2px 8px',   fontSize: '10px' },
  md: { padding: '4px 12px',  fontSize: '12px' },
  lg: { padding: '6px 16px',  fontSize: '14px' },
};

const baseStyle: React.CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  borderRadius: '9999px',
  fontWeight: 600,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const sz = sizeMap[size];

  if (status === 'stable') {
    return (
      <div
        className={className}
        role="status"
        aria-label="Financial status: Stable"
        style={{
          ...baseStyle,
          ...sz,
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#22c55e',
        }}
      >
        <span aria-hidden="true" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        Stable
      </div>
    );
  }

  if (status === 'watch') {
    return (
      <motion.div
        className={className}
        role="status"
        aria-label="Financial status: Watch — spending approaching limits"
        aria-live="polite"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          ...baseStyle,
          ...sz,
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#f59e0b',
        }}
      >
        <span aria-hidden="true" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
        Watch
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      role="alert"
      aria-label="Financial status: Critical — immediate action required"
      aria-live="assertive"
      variants={criticalPulse}
      animate="animate"
      style={{
        ...baseStyle,
        ...sz,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#ef4444',
      }}
    >
      <motion.span
        aria-hidden="true"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}
      />
      Critical
    </motion.div>
  );
};
