import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { C } from '../DesignTokens';

interface MetricItem {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  color: string;
  icon: string;
}

const METRICS: MetricItem[] = [
  { label: 'Statements Analyzed', value: 14820, suffix: '+', prefix: '', color: '#6366f1', icon: '📊' },
  { label: 'Nudges Delivered', value: 38450, suffix: '+', prefix: '', color: '#14b8a6', icon: '⚡' },
  { label: 'Saved by Users', value: 2840000, suffix: '', prefix: '₹', color: '#22c55e', icon: '💰' },
  { label: 'Avg. Runway Extended', value: 11, suffix: ' days', prefix: '+', color: '#ec4899', icon: '📅' },
  { label: 'Coach Confidence', value: 94.2, suffix: '%', prefix: '', color: '#f59e0b', icon: '🎯' },
  { label: 'Privacy Score', value: 100, suffix: '%', prefix: '', color: '#8b5cf6', icon: '🛡️' },
];

function AnimatedCounter({ target, prefix, suffix, duration = 2000 }: { target: number; prefix: string; suffix: string; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCurrent(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  const formatted = target >= 100000
    ? `${prefix}${(current / 100000).toFixed(1)}L${suffix}`
    : target >= 1000
    ? `${prefix}${(current / 1000).toFixed(1)}K${suffix}`
    : Number.isInteger(target)
    ? `${prefix}${Math.round(current)}${suffix}`
    : `${prefix}${current.toFixed(1)}${suffix}`;

  return <>{formatted}</>;
}

export const LiveMetricsTicker: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', overflow: 'hidden', position: 'relative', padding: '0 24px' }}>
      {/* Gradient fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(90deg, #03030c, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(270deg, #03030c, transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{
          display: 'flex',
          gap: '6px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px 0',
        }}
      >
        {METRICS.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 16 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.015)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
              minWidth: '170px',
            }}
          >
            <span style={{ fontSize: '16px' }}>{metric.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '15px',
                fontWeight: 800,
                color: metric.color,
                letterSpacing: '-0.5px',
              }}>
                {isVisible ? (
                  <AnimatedCounter target={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
                ) : (
                  `${metric.prefix}0${metric.suffix}`
                )}
              </span>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '10px',
                color: 'rgba(200,210,255,0.45)',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}>
                {metric.label}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
