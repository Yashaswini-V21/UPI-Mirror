import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui';
import { useKiraStore } from '../../store/useKiraStore';
import { ChevronDownIcon } from '../ui/Icons';

const signals = [
  { name: 'Anomaly Score',     active: true,  value: 85, weight: 0.35, raw: '3.2 IQR' },
  { name: 'Habit Compulsion',  active: true,  value: 72, weight: 0.25, raw: '0.8 Score' },
  { name: 'Days Left',         active: false, value: 20, weight: 0.20, raw: '12 Days' },
  { name: 'Regret Probability',active: true,  value: 91, weight: 0.20, raw: 'High' },
];

const decisionSteps = [
  { id: 1, name: 'Data Ingestion',     output: 'Parsed 482 rows, identified 6 categories.' },
  { id: 2, name: 'Anomaly Detection',  output: 'Weekly spend 3× above IQR threshold detected.' },
  { id: 3, name: 'Habit Scoring',      output: 'Compulsive pattern in Swiggy/Zomato (Score: 0.82).' },
  { id: 4, name: 'Runway Projection',  output: 'Current burn rate exhausts funds in 12 days.' },
  { id: 5, name: 'LLM Synthesis',      output: 'Generated high-urgency intervention narrative.' },
];

const qualityMetrics = [
  { name: 'Forecast MAE',     value: 88 },
  { name: 'Signal Coverage',  value: 95 },
  { name: 'Nudge Acceptance', value: 64 },
  { name: 'Overall Score',    value: 92 },
];

const getMeaning = (name: string, active: boolean): string => {
  if (name === 'Anomaly Score')      return active ? 'Unusual spending spike detected (IQR outlier)' : 'Spending within normal weekly range';
  if (name === 'Habit Compulsion')   return active ? 'Compulsive pattern in top category' : 'Low compulsion — occasional spending';
  if (name === 'Days Left')          return active ? 'Healthy runway — over 2 weeks' : 'Warning: under 2 weeks remaining';
  if (name === 'Regret Probability') return active ? 'High-regret purchases detected' : 'Low regret signal — intentional spending';
  return 'Analyzed successfully';
};

const AccordionSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const id = `accordion-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <GlassCard padding="sm">
      <button
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '8px 4px', color: 'white',
        }}
      >
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '14px' }}>{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} aria-hidden="true">
          <ChevronDownIcon size={16} color="rgba(255,255,255,0.5)" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="region"
            aria-labelledby={`${id}-btn`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '16px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

export const ExplainTab = () => {
  const { coachData } = useKiraStore();
  const confidence = coachData?.confidence ?? 94;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* CONFIDENCE RING */}
      <GlassCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
        <div style={{ position: 'relative', width: '140px', height: '140px' }} role="img" aria-label={`Decision confidence: ${confidence}%`}>
          <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="ex-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#a855f7" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <motion.circle
              cx="70" cy="70" r="58" fill="none" stroke="url(#ex-grad)" strokeWidth="10" strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: confidence / 100 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 800, color: '#a855f7' }}>
            {confidence}%
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: '16px', letterSpacing: '0.1em' }}>
          Decision Confidence
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }} role="list" aria-label="Active signals">
          {signals.map(s => (
            <div
              key={s.name}
              role="listitem"
              aria-label={`${s.name}: ${s.active ? 'active' : 'silent'}`}
              title={s.name}
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.active ? '#a855f7' : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>
      </GlassCard>

      {/* SIGNAL WEIGHTS */}
      <GlassCard>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.1em' }}>
          Signal Analysis
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} role="list">
          {signals.map((s, i) => (
            <div key={s.name} role="listitem">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '13px', color: 'white' }}>{s.name}</span>
                <span
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: s.active ? '#22c55e' : 'rgba(255,255,255,0.3)', padding: '2px 6px', background: s.active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '4px' }}
                  aria-label={s.active ? 'Active' : 'Silent'}
                >
                  {s.active ? 'ACTIVE' : 'SILENT'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }} role="progressbar" aria-valuenow={s.value} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.name}: ${s.value}%`}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${s.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                    style={{ height: '100%', background: s.active ? 'linear-gradient(90deg, #a855f7, #3b82f6)' : 'rgba(255,255,255,0.2)', borderRadius: '99px' }}
                  />
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.5)', width: '28px', textAlign: 'right' }}>{s.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* INTERPRETATION TABLE */}
      <GlassCard padding="none" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} role="table" aria-label="Signal interpretation">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Signal', 'Raw', 'Weight', 'Meaning'].map(h => (
                  <th key={h} scope="col" style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signals.map((s, i) => (
                <motion.tr
                  key={s.name}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'white' }}>{s.name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{s.raw}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{s.weight}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{getMeaning(s.name, s.active)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* DECISION CHAIN ACCORDION */}
      <AccordionSection title="How did Kira decide this?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {decisionSteps.map((step, i) => (
            <div key={step.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div aria-hidden="true" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(168,85,247,0.12)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 600, flexShrink: 0 }}>
                0{step.id}
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>{step.name}</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{step.output}</div>
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* MODEL QUALITY ACCORDION */}
      <AccordionSection title="Model Quality Metrics">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {qualityMetrics.map((q, i) => (
            <div key={q.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{q.name}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>{q.value}/100</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }} role="progressbar" aria-valuenow={q.value} aria-valuemin={0} aria-valuemax={100} aria-label={`${q.name}: ${q.value}/100`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${q.value}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #3b82f6)', borderRadius: '99px' }}
                />
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

    </div>
  );
};
