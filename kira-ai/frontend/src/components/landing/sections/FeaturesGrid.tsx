import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Smartphone, Shield } from 'lucide-react';
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

export const FeaturesGrid: React.FC = () => {
  const [toggleActive, setToggleActive] = useState(true);
  const [parserHov, setParserHov] = useState(false);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [selectedNudge, setSelectedNudge] = useState<'food' | 'chai' | 'transit'>('food');
  const [nudgeMessage, setNudgeMessage] = useState('Kira Alert: Food delivery limit breached. Swiggy has taken 40% of your allowance. Freeze Swiggy for 3 days to recover ₹1,820.');

  const handleNudgeSelect = (type: 'food' | 'chai' | 'transit') => {
    setSelectedNudge(type);
    if (type === 'food') setNudgeMessage('Kira Alert: Food delivery limit breached. Swiggy has taken 40% of your allowance. Freeze Swiggy for 3 days to recover ₹1,820.');
    else if (type === 'chai') setNudgeMessage('Kira Alert: Cafe micro-leakage! Daily Chai visits are projecting a runway exhaustion by June 12th. Switch to office pantry to save ₹680.');
    else setNudgeMessage('Kira Alert: Rapid transit drain. Daily Uber rides have climbed 15% this week. Action: Take the metro to extend cash runway by 5 days.');
  };

  const cardAnim = (dir: 'left' | 'right' | 'up' | 'scale') => ({
    hidden: dir === 'left' ? { opacity: 0, x: -40 } : dir === 'right' ? { opacity: 0, x: 40 } : dir === 'up' ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.92 },
    show: { opacity: 1, x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 85, damping: 16 } },
  });

  return (
    <section id="features" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 700, color: C.indigo, textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(99,102,241,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(99,102,241,0.07)', display: 'inline-block', marginBottom: '16px' }}>Core Capabilities</motion.div>
        <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: '0' }}>
          Engineered for{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Outfit, sans-serif', background: `linear-gradient(90deg,${C.teal},${C.indigo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>financial clarity.</span>
        </motion.h2>
      </div>

      <style>{`
        .feat-grid { display:grid; grid-template-columns:repeat(3,1fr); grid-auto-rows:minmax(280px,auto); gap:24px; }
        .feat-span2 { grid-column:span 2; }
        .interactive-node:hover { transform:scale(1.1); filter:drop-shadow(0 0 10px rgba(20,184,166,0.8)); }
        @media(max-width:1024px){ .feat-grid { grid-template-columns:repeat(2,1fr)!important; } .feat-span2 { grid-column:span 2!important; } }
        @media(max-width:640px){ .feat-grid { grid-template-columns:1fr!important; grid-auto-rows:auto!important; } .feat-span2 { grid-column:span 1!important; } }
      `}</style>

      <div className="feat-grid">
        {/* Card 1: LangGraph Network */}
        <motion.div variants={cardAnim('left')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="feat-span2">
          <SpotlightCard glowColor="rgba(20,184,166,0.14)" style={{ background: 'rgba(6,6,20,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(28px)', height: '100%' }}>
            <div style={{ padding: '34px', display: 'flex', gap: '32px', height: '100%', alignItems: 'center', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              <div style={{ flex: 1.2, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `rgba(20,184,166,0.12)`, border: `1px solid rgba(20,184,166,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Cpu size={18} color={C.teal} /></div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', color: C.teal, fontWeight: 700 }}>SUPERVISOR NETWORK</span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>LangGraph Logic Pipeline</h3>
                <p style={{ color: C.textMuted, fontSize: '14px', margin: 0, lineHeight: 1.68 }}>Kira utilizes a multi-agent logic network. Ingested statements traverse separate regressors that audit models, detect spikes, and verify advice against safety templates automatically.</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                  {['Parser', 'Classifier', 'Regressor', 'Auditor'].map((n, i) => (
                    <React.Fragment key={n}>
                      <span style={{ padding: '4px 12px', borderRadius: '8px', background: activeNode === i ? 'rgba(20,184,166,0.18)' : 'rgba(20,184,166,0.06)', border: activeNode === i ? `1px solid ${C.teal}` : `1px solid rgba(20,184,166,0.2)`, fontSize: '9.5px', fontFamily: 'JetBrains Mono, monospace', color: activeNode === i ? 'white' : C.teal, fontWeight: 700, transition: 'all 0.3s' }}>{n}</span>
                      {i < 3 && <span style={{ width: '12px', height: '1.5px', background: activeNode === i ? C.teal : 'rgba(255,255,255,0.06)' }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div style={{ width: '180px', height: '160px', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="100%" viewBox="0 0 180 160" style={{ overflow: 'visible' }}>
                  {[[25, 80, 90, 35], [25, 80, 90, 125], [90, 35, 155, 80], [90, 125, 155, 80]].map(([x1, y1, x2, y2], i) => (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                      <motion.line x1={x1} y1={y1} x2={x2} y2={y2} stroke={activeNode === i || activeNode === i + 1 ? C.teal : 'rgba(20,184,166,0.25)'} strokeWidth="1.8" strokeDasharray="5,5" animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
                    </g>
                  ))}
                  {[{ x: 25, y: 80, label: 'Parser' }, { x: 90, y: 35, label: 'Classifier' }, { x: 90, y: 125, label: 'Regressor' }, { x: 155, y: 80, label: 'Auditor' }].map((node, i) => (
                    <g key={i} onMouseEnter={() => setActiveNode(i)} onMouseLeave={() => setActiveNode(null)} style={{ cursor: 'pointer' }} className="interactive-node">
                      <circle cx={node.x} cy={node.y} r="18" fill="#03030c" stroke={activeNode === i ? C.teal : 'rgba(255,255,255,0.1)'} strokeWidth="2" />
                      <circle cx={node.x} cy={node.y} r="4" fill={activeNode === i ? C.teal : 'rgba(255,255,255,0.2)'} />
                      <text x={node.x} y={node.y - 24} textAnchor="middle" fontSize="8" fill={activeNode === i ? 'white' : 'rgba(255,255,255,0.45)'} fontFamily="JetBrains Mono" fontWeight="bold">{node.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 2: Statement Parser */}
        <motion.div variants={cardAnim('scale')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} onMouseEnter={() => setParserHov(true)} onMouseLeave={() => setParserHov(false)}>
          <SpotlightCard glowColor="rgba(99,102,241,0.14)" style={{ background: 'rgba(6,6,20,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(28px)', height: '100%' }}>
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(99,102,241,0.12)', border: `1px solid rgba(99,102,241,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} color={C.indigo} /></div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.indigo, fontWeight: 700 }}>PARSER CORE</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: parserHov ? '#22c55e' : C.textFaint, fontWeight: 700, transition: 'color 0.3s' }}>{parserHov ? 'COMPILING...' : 'STANDBY'}</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Statement Parser</h3>
              <p style={{ color: C.textMuted, fontSize: '13.5px', margin: 0, lineHeight: 1.6, flexGrow: 1 }}>Ingests statements securely and extracts raw parameters into mapped datasets locally.</p>
              <div style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: parserHov ? '#4ade80' : 'rgba(255,255,255,0.3)', minHeight: '44px', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'color 0.3s' }}>
                {parserHov ? (<><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>&gt; PARSING swiggy_stmt.csv</motion.span><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.1 }}>&gt; SUCCESS: 14 rows structured</motion.span></>) : (<><span>&gt; awaiting upload stream</span><span>&gt; session isolated</span></>)}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>
                  <span>Parse rate</span>
                  <span style={{ color: parserHov ? '#22c55e' : C.textFaint }}>{parserHov ? '99.7%' : '0%'}</span>
                </div>
                <AnimatedProgressBar value={parserHov ? 99.7 : 0} color={C.indigo} />
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 3: WhatsApp Nudges */}
        <motion.div variants={cardAnim('up')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="feat-span2">
          <SpotlightCard glowColor="rgba(236,72,153,0.14)" style={{ background: 'rgba(6,6,20,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(28px)', height: '100%' }}>
            <div style={{ padding: '34px', display: 'flex', gap: '32px', height: '100%', alignItems: 'center', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              <div style={{ flex: 1.1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236,72,153,0.1)', border: `1px solid rgba(236,72,153,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Smartphone size={18} color={C.pink} /></div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', color: C.pink, fontWeight: 700 }}>BEHAVIORAL ROUTER</span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>WhatsApp Budget Nudges</h3>
                <p style={{ color: C.textMuted, fontSize: '14px', margin: 0, lineHeight: 1.68 }}>No complex dashboards to check. Kira dispatches custom coaching nudges that highlight discretionary leaks directly on your lockscreen.</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {[{ type: 'food', label: '🍔 Swiggy Loop', color: C.pink }, { type: 'chai', label: '☕ Cafe Leak', color: C.teal }, { type: 'transit', label: '🚗 Uber Surge', color: '#f59e0b' }].map(tab => (
                    <button key={tab.type} onClick={() => handleNudgeSelect(tab.type as any)} style={{ padding: '6px 14px', background: selectedNudge === tab.type ? 'white' : 'rgba(255,255,255,0.03)', border: selectedNudge === tab.type ? `1px solid ${tab.color}` : `1px solid rgba(255,255,255,0.08)`, borderRadius: '99px', fontSize: '11px', fontWeight: 700, color: selectedNudge === tab.type ? 'black' : 'rgba(255,255,255,0.65)', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'Outfit, sans-serif' }}>{tab.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ width: '220px', height: '170px', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '100%', background: '#0b141a', border: '4px solid #2d2d30', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.7)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: '#075e54', padding: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px' }}>💬</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'white', fontFamily: 'Outfit, sans-serif' }}>Kira Budget Coach</span>
                      <span style={{ fontSize: '7px', color: '#25d366', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>online</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'radial-gradient(circle,rgba(7,94,84,0.05),transparent 75%)' }}>
                    <AnimatePresence mode="wait">
                      <motion.div key={selectedNudge} initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }} transition={{ type: 'spring', damping: 15 }} style={{ background: '#056162', borderRadius: '0px 14px 14px 14px', padding: '8px 12px', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                        <p style={{ margin: 0, fontSize: '9.5px', fontFamily: 'Outfit, sans-serif', lineHeight: 1.4 }}>{nudgeMessage}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                          <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>12:44 PM</span>
                          <span style={{ color: '#34b7f1', fontSize: '7px' }}>✓✓</span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 4: Privacy Isolation */}
        <motion.div variants={cardAnim('right')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <SpotlightCard glowColor="rgba(20,184,166,0.12)" style={{ background: 'rgba(6,6,20,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(28px)', height: '100%' }}>
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(20,184,166,0.1)', border: `1px solid rgba(20,184,166,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={16} color={C.teal} /></div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.teal, fontWeight: 700 }}>CIRCUIT BREAKER</span>
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Privacy Isolation</h3>
              <p style={{ color: C.textMuted, fontSize: '13.5px', margin: 0, lineHeight: 1.6, flexGrow: 1 }}>Volatile sandbox storage ensures bank details are regex-scrubbed before hitting remote streams.</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, padding: '12px 18px', borderRadius: '16px', boxShadow: toggleActive ? 'inset 0 0 10px rgba(34,197,94,0.06)' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: toggleActive ? '#4ade80' : C.textFaint, fontWeight: 800, textShadow: toggleActive ? '0 0 8px rgba(74,222,128,0.3)' : 'none', transition: 'all 0.3s' }}>{toggleActive ? 'VAULT SECURED' : 'UNSECURED'}</span>
                  <span style={{ fontSize: '7.5px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>Regex Purge Active</span>
                </div>
                <button onClick={() => setToggleActive(!toggleActive)} style={{ width: '42px', height: '22px', borderRadius: '99px', background: toggleActive ? '#22c55e' : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', position: 'relative', padding: '2px', transition: 'background 0.3s', boxShadow: toggleActive ? '0 0 12px rgba(34,197,94,0.4)' : 'none' }}>
                  <motion.div layout style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', left: toggleActive ? '22px' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                </button>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
};
