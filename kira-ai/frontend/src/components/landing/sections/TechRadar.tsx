import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../DesignTokens';

interface TechNode {
  id: string;
  label: string;
  ring: number; // 0=core, 1=mid, 2=outer
  angle: number; // degrees
  color: string;
  icon: string;
  description: string;
  category: 'ai' | 'security' | 'infrastructure' | 'frontend';
}

const TECH_NODES: TechNode[] = [
  // Core ring (ring 0)
  { id: 'langgraph', label: 'LangGraph', ring: 0, angle: 0, color: '#6366f1', icon: '🧠', description: '6-node stateful supervisor pipeline for adaptive coaching orchestration.', category: 'ai' },
  { id: 'gemini', label: 'Gemini 2.0', ring: 0, angle: 72, color: '#14b8a6', icon: '✨', description: 'Flash model for narrative generation with circuit-breaker fallback.', category: 'ai' },
  { id: 'fastapi', label: 'FastAPI', ring: 0, angle: 144, color: '#22c55e', icon: '⚡', description: 'Production-hardened API with OWASP headers, rate limits, and GZip.', category: 'infrastructure' },
  { id: 'react', label: 'React 18', ring: 0, angle: 216, color: '#61DAFB', icon: '⚛️', description: 'Concurrent-mode UI with Suspense, ErrorBoundary, and Framer Motion.', category: 'frontend' },
  { id: 'wasm', label: 'WASM Sandbox', ring: 0, angle: 288, color: '#ec4899', icon: '🔒', description: 'Client-side de-identification before any data reaches the server.', category: 'security' },

  // Mid ring (ring 1)
  { id: 'breaker', label: 'Circuit Breaker', ring: 1, angle: 36, color: '#f59e0b', icon: '🔌', description: 'Pybreaker with 5-fail trip and 60s recovery for LLM reliability.', category: 'security' },
  { id: 'prometheus', label: 'Prometheus', ring: 1, angle: 108, color: '#e74c3c', icon: '📈', description: 'Counters, gauges, and histograms for real-time system observability.', category: 'infrastructure' },
  { id: 'zustand', label: 'Zustand', ring: 1, angle: 180, color: '#a855f7', icon: '🗃️', description: 'Lightweight global state with sessionStorage persistence.', category: 'frontend' },
  { id: 'sklearn', label: 'scikit-learn', ring: 1, angle: 252, color: '#3b82f6', icon: '📐', description: 'Linear regression for broke-date prediction with confidence bands.', category: 'ai' },
  { id: 'pydantic', label: 'Pydantic v2', ring: 1, angle: 324, color: '#10b981', icon: '✅', description: 'Strict runtime validation for all API request/response schemas.', category: 'infrastructure' },

  // Outer ring (ring 2)
  { id: 'sha256', label: 'SHA-256 PII', ring: 2, angle: 18, color: '#8b5cf6', icon: '🛡️', description: 'Merchant names hashed with SHA-256 in logs and exports.', category: 'security' },
  { id: 'structlog', label: 'structlog', ring: 2, angle: 90, color: '#06b6d4', icon: '📝', description: 'Structured JSON logging with request correlation IDs.', category: 'infrastructure' },
  { id: 'vite', label: 'Vite', ring: 2, angle: 162, color: '#fbbf24', icon: '🏗️', description: 'HMR dev server + optimized production builds with chunk splitting.', category: 'frontend' },
  { id: 'recharts', label: 'Recharts', ring: 2, angle: 234, color: '#f472b6', icon: '📊', description: 'Responsive SVG charts for forecast bands and spending visuals.', category: 'frontend' },
  { id: 'cachetools', label: 'TTL Cache', ring: 2, angle: 306, color: '#84cc16', icon: '⏱️', description: 'Dual-tier TTL cache: 1hr coach results + 24hr narrative cache.', category: 'infrastructure' },
];

const RING_RADII = [90, 155, 215];
const CATEGORY_COLORS: Record<string, string> = {
  ai: '#6366f1',
  security: '#ec4899',
  infrastructure: '#22c55e',
  frontend: '#61DAFB',
};

export const TechRadar: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<TechNode | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.15) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isVisible]);

  const cx = 260;
  const cy = 260;

  return (
    <section
      ref={ref}
      style={{
        padding: '100px 24px',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '60px' }}
        >
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: C.indigo, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            SYSTEM ARCHITECTURE
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, color: 'white', margin: '12px 0 16px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-1px' }}>
            Technology <span style={{ background: C.gradH, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Radar</span>
          </h2>
          <p style={{ fontSize: '15px', color: C.textMuted, maxWidth: '560px', margin: '0 auto', lineHeight: 1.6, fontFamily: 'Outfit, sans-serif' }}>
            Every layer — from client-side privacy to server-side intelligence — engineered for production-grade reliability.
          </p>
        </motion.div>

        {/* Radar + Info layout */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '60px', flexWrap: 'wrap' }}>
          {/* SVG Radar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <svg width="520" height="520" viewBox="0 0 520 520" style={{ maxWidth: '100%', height: 'auto' }}>
              {/* Rotating scanner line */}
              <line
                x1={cx} y1={cy}
                x2={cx + Math.cos((rotation * Math.PI) / 180) * 230}
                y2={cy + Math.sin((rotation * Math.PI) / 180) * 230}
                stroke="rgba(99,102,241,0.25)" strokeWidth="1.5"
              />
              <line
                x1={cx} y1={cy}
                x2={cx + Math.cos(((rotation + 180) * Math.PI) / 180) * 230}
                y2={cy + Math.sin(((rotation + 180) * Math.PI) / 180) * 230}
                stroke="rgba(20,184,166,0.15)" strokeWidth="1"
              />

              {/* Concentric rings */}
              {RING_RADII.map((r, i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray={i === 2 ? '4 6' : 'none'} />
              ))}

              {/* Cross hairs */}
              <line x1={cx - 230} y1={cy} x2={cx + 230} y2={cy} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1={cx} y1={cy - 230} x2={cx} y2={cy + 230} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Ring labels */}
              <text x={cx + RING_RADII[0] + 4} y={cy - 4} fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="JetBrains Mono, monospace">CORE</text>
              <text x={cx + RING_RADII[1] + 4} y={cy - 4} fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily="JetBrains Mono, monospace">LAYER</text>
              <text x={cx + RING_RADII[2] + 4} y={cy - 4} fill="rgba(255,255,255,0.08)" fontSize="8" fontFamily="JetBrains Mono, monospace">EDGE</text>

              {/* Tech nodes */}
              {TECH_NODES.map((node) => {
                const r = RING_RADII[node.ring];
                const rad = (node.angle * Math.PI) / 180;
                const x = cx + Math.cos(rad) * r;
                const y = cy + Math.sin(rad) * r;
                const isHovered = hoveredNode?.id === node.id;
                const nodeRadius = isHovered ? 18 : 14;

                return (
                  <g
                    key={node.id}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Glow */}
                    <circle cx={x} cy={y} r={nodeRadius + 8} fill={node.color} opacity={isHovered ? 0.15 : 0.05} />
                    {/* Pulse ring */}
                    {isHovered && (
                      <>
                        <circle cx={x} cy={y} r={nodeRadius + 14} fill="none" stroke={node.color} strokeWidth="1" opacity="0.3">
                          <animate attributeName="r" from={String(nodeRadius + 8)} to={String(nodeRadius + 22)} dur="1.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                      </>
                    )}
                    {/* Node circle */}
                    <circle cx={x} cy={y} r={nodeRadius} fill={isHovered ? node.color : 'rgba(3,3,10,0.9)'} stroke={node.color} strokeWidth={isHovered ? 2.5 : 1.5} />
                    {/* Icon */}
                    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize={isHovered ? '14' : '12'}>
                      {node.icon}
                    </text>
                    {/* Label */}
                    <text
                      x={x}
                      y={y + nodeRadius + 14}
                      textAnchor="middle"
                      fill={isHovered ? 'white' : 'rgba(200,210,255,0.5)'}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={isHovered ? '800' : '500'}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}

              {/* Center core */}
              <circle cx={cx} cy={cy} r="24" fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
              <text x={cx} y={cy - 3} textAnchor="middle" fill="white" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="800">KIRA</text>
              <text x={cx} y={cy + 9} textAnchor="middle" fill="rgba(99,102,241,0.8)" fontSize="7" fontFamily="JetBrains Mono, monospace">ENGINE</text>
            </svg>
          </motion.div>

          {/* Hover info panel */}
          <div style={{ width: '280px', minHeight: '200px' }}>
            <AnimatePresence mode="wait">
              {hoveredNode ? (
                <motion.div
                  key={hoveredNode.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${hoveredNode.color}30`,
                    borderRadius: '20px',
                    padding: '24px',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '28px' }}>{hoveredNode.icon}</span>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'white', fontFamily: 'Outfit, sans-serif' }}>{hoveredNode.label}</div>
                      <div style={{
                        fontSize: '9px',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: CATEGORY_COLORS[hoveredNode.category],
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}>
                        {hoveredNode.category} · {['CORE', 'LAYER', 'EDGE'][hoveredNode.ring]}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: C.textMuted, lineHeight: 1.55, fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                    {hoveredNode.description}
                  </p>
                  <div style={{ marginTop: '14px', height: '3px', borderRadius: '2px', background: `linear-gradient(90deg, ${hoveredNode.color}, transparent)` }} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    color: 'rgba(200,210,255,0.25)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    textAlign: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '24px', opacity: 0.5 }}>🎯</span>
                  <span>Hover a node to inspect</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px', justifyContent: 'center' }}>
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(200,210,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
