import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Calendar, Database, Lock, Shield, Terminal } from 'lucide-react';
import { C } from '../DesignTokens';
import { SpotlightCard } from '../primitives/SpotlightCard';

const AnimatedProgressBar = ({ value, color }: { value: number; color: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: inView ? `${value}%` : 0 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} style={{ height: '100%', background: color, borderRadius: '4px', boxShadow: `0 0 8px ${color}66` }} />
    </div>
  );
};

export const SecuritySection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const items = [
    { title: 'Immutable SHA-256 Hashed Logs', desc: 'Every logic audit trail is printed cryptographically to local JSON Lines streams.', icon: <Database size={18} />, tag: 'IMMUTABLE', color: C.teal },
    { title: 'One-Way UPI De-identification', desc: 'Raw UPI merchant names are regex-scrubbed before hitting any LLM pipeline.', icon: <Lock size={18} />, tag: 'SANDBOXED', color: C.indigo },
    { title: '90-Day Auto Log Purges', desc: 'Analytics buffers sit strictly inside volatile local memory with strict TTLs.', icon: <Calendar size={18} />, tag: 'VOLATILE', color: C.pink },
    { title: 'Circuit Breaker Policies', desc: 'Any agent timeout triggers immediate fallback and state recovery without data leakage.', icon: <Shield size={18} />, tag: 'SHIELDED', color: '#f59e0b' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.9 }} id="security" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(20,184,166,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(20,184,166,0.07)', display: 'inline-block', marginBottom: '16px' }}>Secured by Architecture</motion.div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: '0 0 16px 0' }}>
          Privacy-centric{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', color: C.teal }}>governance.</span>
        </h2>
        <p style={{ color: C.textMuted, fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto' }}>Kira reads statements in sandboxed stores with masked merchant codes and immediate session purges.</p>
      </div>

      {/* Threat Map Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} style={{ background: 'rgba(6,6,18,0.7)', border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px 28px', marginBottom: '24px', backdropFilter: 'blur(20px)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={16} color={C.teal} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: C.textFaint, fontWeight: 600 }}>KIRA_THREAT_COMMAND_CENTER</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[{ label: 'THREAT LEVEL', val: 'LOW', color: '#22c55e' }, { label: 'BREACHES', val: '0', color: C.teal }, { label: 'UPTIME', val: '99.97%', color: C.indigo }].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: C.textFaint, letterSpacing: '0.5px' }}>{s.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: s.color, fontWeight: 800 }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[{ label: 'Parser latency', val: 95 }, { label: 'Classifier latency', val: 78 }, { label: 'Network integrity', val: 100 }, { label: 'Audit compliance', val: 88 }].map((m, i) => (
            <div key={i} style={{ flex: '1 1 140px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.textFaint }}>{m.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.teal }}>{m.val}%</span>
              </div>
              <AnimatedProgressBar value={m.val} color={m.val > 90 ? C.teal : C.indigo} />
            </div>
          ))}
        </div>
      </motion.div>

      <style>{`.sec-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; } @media(max-width:768px){ .sec-grid { grid-template-columns:1fr!important; } }`}</style>
      <div className="sec-grid">
        {items.map((item, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} onClick={() => setActiveIdx(activeIdx === idx ? null : idx)} style={{ cursor: 'pointer' }}>
            <SpotlightCard glowColor={`${item.color}15`} style={{ background: activeIdx === idx ? 'rgba(6,6,18,0.8)' : 'rgba(6,6,18,0.5)', border: activeIdx === idx ? `1px solid ${item.color}44` : `1px solid ${C.border}`, backdropFilter: 'blur(20px)', transition: 'all 0.3s', boxShadow: activeIdx === idx ? `0 12px 40px rgba(0,0,0,0.4),0 0 20px ${item.color}15` : 'none' }}>
              <div style={{ padding: '26px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: `${item.color}15`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>{item.icon}</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'white', fontFamily: 'Outfit, sans-serif', lineHeight: 1.3 }}>{item.title}</h3>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8.5px', padding: '3px 8px', borderRadius: '6px', background: `${item.color}10`, color: item.color, border: `1px solid ${item.color}28`, fontWeight: 700, flexShrink: 0 }}>{item.tag}</span>
                </div>
                <AnimatePresence>
                  {activeIdx === idx && (<motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: C.textMuted, fontSize: '13.5px', lineHeight: 1.65, margin: 0 }}>{item.desc}</motion.p>)}
                </AnimatePresence>
                {activeIdx !== idx && <p style={{ color: C.textFaint, fontSize: '13.5px', lineHeight: 1.65, margin: 0 }}>{item.desc.substring(0, 70)}...</p>}
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
