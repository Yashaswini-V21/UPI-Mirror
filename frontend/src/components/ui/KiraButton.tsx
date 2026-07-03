import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface KiraButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '12px', gap: '6px' },
  md: { padding: '10px 18px', fontSize: '14px', gap: '8px' },
  lg: { padding: '14px 28px', fontSize: '16px', gap: '10px' },
};

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 20px rgba(147,51,234,0.35)',
  },
  secondary: {
    background: 'var(--bg-elevated, #1a1b26)',
    color: 'var(--text-primary, #ffffff)',
    border: '1px solid var(--border-default, #2a2c3a)',
  },
  ghost: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  danger: {
    background: 'rgba(239,68,68,0.08)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.4)',
  },
  success: {
    background: 'rgba(34,197,94,0.08)',
    color: '#22c55e',
    border: '1px solid rgba(34,197,94,0.4)',
  },
};

export const KiraButton = React.forwardRef<HTMLButtonElement, KiraButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className = '', style, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
        className={`kira-button ${className}`}
        disabled={isDisabled}
        aria-busy={loading}
        style={{
          ...variantStyles[variant],
          ...sizeStyles[size],
          borderRadius: '8px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 500,
          opacity: isDisabled && !loading ? 0.5 : 1,
          transition: 'opacity 0.2s, box-shadow 0.2s',
          textDecoration: 'none',
          lineHeight: 1,
          ...style,
        }}
        {...(props as any)}
      >
        {/* Shine sweep — primary only, GPU-safe translateX not left */}
        {variant === 'primary' && !isDisabled && (
          <motion.span
            aria-hidden="true"
            initial={{ x: '-150%' }}
            whileHover={{ x: '200%' }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
              transform: 'skewX(-20deg)',
              pointerEvents: 'none',
            }}
          />
        )}

        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span
              key="loader"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.25)',
                  borderTopColor: 'white',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              Loading…
            </motion.span>
          ) : (
            <motion.span
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'inherit' }}
            >
              {icon && <span aria-hidden="true">{icon}</span>}
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

KiraButton.displayName = 'KiraButton';
