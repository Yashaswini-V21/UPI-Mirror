import React, { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

export type AccentColor = 'purple' | 'green' | 'blue' | 'red' | 'amber' | 'none';
export type PaddingSize = 'none' | 'sm' | 'md' | 'lg';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: AccentColor;
  padding?: PaddingSize;
  glow?: boolean;
  interactive?: boolean;
}

const accentColors: Record<AccentColor, string> = {
  purple: '#a855f7',
  green:  '#22c55e',
  blue:   '#3b82f6',
  red:    '#ef4444',
  amber:  '#f59e0b',
  none:   'transparent',
};

const paddingMap: Record<PaddingSize, string> = {
  none: '0px',
  sm:   '12px',
  md:   '24px',
  lg:   '32px',
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ accent = 'none', padding = 'md', glow = false, interactive = false, children, className = '', style, ...props }, ref) => {
    const color = accentColors[accent];
    const isInteractive = interactive || !!props.onClick;

    return (
      <motion.div
        ref={ref as React.Ref<HTMLDivElement>}
        whileHover={isInteractive ? { y: -3, scale: 1.005 } : undefined}
        transition={{ duration: 0.2 }}
        className={`kira-glass-card ${className}`}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={isInteractive && props.onClick
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') (props as any).onClick?.(e as any); }
          : undefined}
        style={{
          background: 'var(--bg-surface, #0d0f17)',
          border: accent !== 'none' ? `1px solid ${color}33` : '1px solid var(--border-default, #2a2c3a)',
          borderLeft: accent !== 'none' ? `2px solid ${color}` : '1px solid var(--border-default, #2a2c3a)',
          borderRadius: 'var(--r-xl, 16px)',
          boxShadow: glow && accent !== 'none' ? `0 0 24px ${color}22, var(--shadow-md, 0 4px 12px rgba(0,0,0,0.3))` : 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.3))',
          padding: paddingMap[padding],
          position: 'relative',
          overflow: 'hidden',
          cursor: isInteractive ? 'pointer' : 'default',
          ...style,
        }}
        {...(props as any)}
      >
        {/* Subtle accent tint background — only when accent is set, no shimmer loop */}
        {accent !== 'none' && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at top left, ${color}08, transparent 60%)`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
