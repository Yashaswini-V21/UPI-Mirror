/**
 * AgentPipelineVisualizer.tsx
 * ─────────────────────────
 * Kira-AI Live LangGraph Pipeline Visualizer
 * 
 * Renders an animated 6-node pipeline that lights up sequentially,
 * showing the user how the Kira coaching agent "thinks" through
 * each processing stage. Used in the CoachTab during loading.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Pipeline node definitions ─────────────────────────────────────────────────
const PIPELINE_NODES = [
  { id: 'context_injection', label: 'Context', icon: '🧠', description: 'Loading session memory & past interactions', color: '#a78bfa' },
  { id: 'anomaly_check', label: 'Anomaly', icon: '🔍', description: 'Scanning weekly spend for IQR outliers', color: '#f472b6' },
  { id: 'pattern_analysis', label: 'Pattern', icon: '📊', description: 'Classifying spending status & habit scores', color: '#60a5fa' },
  { id: 'nudge_generation', label: 'Nudge', icon: '💬', description: 'Generating targeted coaching intervention', color: '#34d399' },
  { id: 'cap_recommendation', label: 'Cap', icon: '🎯', description: 'Computing optimal spending cap for category', color: '#fbbf24' },
  { id: 'confidence_scoring', label: 'Score', icon: '✅', description: 'Calculating weighted confidence for decision', color: '#14b8a6' },
];

interface PipelineVisualizerProps {
  isActive: boolean;
  onComplete?: () => void;
  speed?: number; // ms per node, default 800
}

export const AgentPipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  isActive,
  onComplete,
  speed = 800,
}) => {
  const [activeNodeIndex, setActiveNodeIndex] = useState(-1);
  const [completedNodes, setCompletedNodes] = useState<Set<number>>(new Set());
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setActiveNodeIndex(-1);
      setCompletedNodes(new Set());
      setIsFinished(false);
      return;
    }

    let index = 0;
    setActiveNodeIndex(0);

    const interval = setInterval(() => {
      setCompletedNodes(prev => new Set([...prev, index]));
      index++;
      if (index >= PIPELINE_NODES.length) {
        clearInterval(interval);
        setIsFinished(true);
        setTimeout(() => onComplete?.(), 400);
        return;
      }
      setActiveNodeIndex(index);
    }, speed);

    return () => clearInterval(interval);
  }, [isActive, speed]);

  return (
    <div style={{
      background: 'rgba(3, 3, 12, 0.6)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(99, 102, 241, 0.15)',
      borderRadius: '24px',
      padding: '28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <motion.div
        animate={{
          opacity: isActive ? [0.05, 0.12, 0.05] : 0,
          scale: isActive ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.div
            animate={isActive && !isFinished ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '18px' }}
          >
            ⚡
          </motion.div>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.08em',
          }}>
            KIRA LANGGRAPH PIPELINE
          </span>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          fontWeight: 700,
          color: isFinished ? '#22c55e' : isActive ? '#14b8a6' : 'rgba(255,255,255,0.3)',
          padding: '4px 12px',
          borderRadius: '99px',
          border: `1px solid ${isFinished ? 'rgba(34,197,94,0.4)' : isActive ? 'rgba(20,184,166,0.3)' : 'rgba(255,255,255,0.08)'}`,
          background: isFinished ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
        }}>
          {isFinished ? '6/6 COMPLETE ✓' : isActive ? `${completedNodes.size}/6 NODES` : 'IDLE'}
        </span>
      </div>

      {/* Pipeline nodes */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
        zIndex: 2,
      }}>
        {PIPELINE_NODES.map((node, idx) => {
          const isCompleted = completedNodes.has(idx);
          const isCurrent = activeNodeIndex === idx && !isCompleted;
          const isPending = !isCompleted && !isCurrent;
          const nodeColor = node.color;

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0.4, x: -10 }}
              animate={{
                opacity: isCurrent ? 1 : isCompleted ? 0.85 : 0.35,
                x: 0,
                scale: isCurrent ? 1.02 : 1,
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: isCurrent
                  ? `linear-gradient(135deg, ${nodeColor}12, rgba(3,3,12,0.4))`
                  : isCompleted
                  ? 'rgba(255,255,255,0.02)'
                  : 'transparent',
                border: isCurrent
                  ? `1px solid ${nodeColor}50`
                  : isCompleted
                  ? '1px solid rgba(255,255,255,0.04)'
                  : '1px solid transparent',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Scanning line for current node */}
              {isCurrent && (
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: ['0%', '100%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '60px',
                    background: `linear-gradient(90deg, transparent, ${nodeColor}20, transparent)`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Node index */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                background: isCompleted
                  ? `${nodeColor}20`
                  : isCurrent
                  ? `${nodeColor}30`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCompleted || isCurrent ? `${nodeColor}40` : 'rgba(255,255,255,0.06)'}`,
                flexShrink: 0,
                transition: 'all 0.3s',
              }}>
                {isCompleted ? '✓' : node.icon}
              </div>

              {/* Node label and description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isCurrent ? 'white' : isCompleted ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)',
                  transition: 'color 0.3s',
                }}>
                  {node.label}
                </div>
                <AnimatePresence>
                  {(isCurrent || isCompleted) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '9.5px',
                        color: isCurrent ? `${nodeColor}` : 'rgba(255,255,255,0.35)',
                        marginTop: '2px',
                        transition: 'color 0.3s',
                      }}
                    >
                      {node.description}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status indicator */}
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '8px',
                fontWeight: 800,
                color: isCompleted ? '#22c55e' : isCurrent ? nodeColor : 'rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}>
                {isCompleted ? 'DONE' : isCurrent ? 'RUNNING' : 'QUEUED'}
              </div>

              {/* Pulse indicator for current */}
              {isCurrent && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: nodeColor,
                    boxShadow: `0 0 8px ${nodeColor}`,
                    flexShrink: 0,
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Completion banner */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: '16px' }}>🎯</span>
            <span style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '12px',
              fontWeight: 700,
              color: '#4ade80',
            }}>
              Pipeline complete — coaching decision rendered
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
