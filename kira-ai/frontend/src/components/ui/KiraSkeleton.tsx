import React from 'react';

export interface KiraSkeletonProps {
  variant?: 'text' | 'card' | 'number' | 'chart' | 'badge';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, React.CSSProperties> = {
  text:   { width: '100%', height: '16px', borderRadius: '4px' },
  card:   { width: '100%', height: '200px', borderRadius: '16px' },
  number: { width: '64px', height: '32px', borderRadius: '8px' },
  chart:  { width: '100%', height: '300px', borderRadius: '12px' },
  badge:  { width: '80px', height: '24px', borderRadius: '9999px' },
};

export const KiraSkeleton: React.FC<KiraSkeletonProps> = ({
  variant = 'text', width, height, className = '', style,
}) => (
  <div
    className={`kira-skeleton animate-shimmer ${className}`}
    role="status"
    aria-label="Loading…"
    style={{
      ...variantStyles[variant],
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      background: 'linear-gradient(90deg, var(--bg-elevated, #1a1b26) 25%, rgba(255,255,255,0.04) 50%, var(--bg-elevated, #1a1b26) 75%)',
      backgroundSize: '200% 100%',
      ...style,
    }}
  />
);
