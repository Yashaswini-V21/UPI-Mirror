/**
 * landing/primitives/SpotlightCard.tsx
 * ─────────────────────────────────────
 * Card with a radial-gradient spotlight that follows cursor.
 */
import React, { HTMLAttributes, useState } from 'react';

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  glowColor = 'rgba(99,102,241,0.15)',
  className = '',
  style = {},
  ...props
}) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setCoords({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`spotlight-card ${className}`}
      style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        ...style,
      }}
      {...props}
    >
      {hov && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 65%)`,
            pointerEvents: 'none',
            zIndex: 1,
            borderRadius: 'inherit',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>{children}</div>
    </div>
  );
};
