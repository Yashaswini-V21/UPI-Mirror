import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowRight } from 'lucide-react';
import { C } from '../DesignTokens';
import { SpotlightCard } from '../primitives/SpotlightCard';

export const NudgePlayground: React.FC = () => {
  const [activePersona, setActivePersona] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [typedNudge, setTypedNudge] = useState('');
  const [phoneState, setPhoneState] = useState<'off' | 'lockscreen' | 'homescreen'>('off');

  const personas = [
    { id: 0, title: 'Software Engineer', avatar: '💻', description: 'Discretionary leakage on delivery apps, daily micro-transit & cloud services.', transactions: ['UPI: ₹1,420 to Swiggy - APPROVED', 'UPI: ₹350 to Uber Auto - APPROVED', 'UPI: ₹840 to Starbucks - APPROVED', 'UPI: ₹4,990 to Amazon Prime - APPROVED', 'UPI: ₹1,180 to Zomato - APPROVED'], nudge: 'Kira Nudge: Food delivery & transit have eaten 45% of your discretionary cap. Cash forecast indicates zero balance by Oct 14th (12 days early). Action: Freeze Swiggy orders for 3 days to recover ₹2,420.' },
    { id: 1, title: 'College Student', avatar: '🎓', description: 'Tight allowance parameters, high weekend dining out, movie bookings.', transactions: ['UPI: ₹220 to Chai Point - APPROVED', 'UPI: ₹480 to PVR Cinemas - APPROVED', 'UPI: ₹120 to Auto Fare - APPROVED', 'UPI: ₹190 to McDonald\'s - APPROVED', 'UPI: ₹299 to Spotify - APPROVED'], nudge: 'Kira Nudge: Daily cafes and movie tickets have consumed 82% of your monthly money with 12 days remaining. Zero-date: June 1st. Action: Switch cafes to campus libraries and save ₹1,150.' },
    { id: 2, title: 'Freelance Designer', avatar: '🎨', description: 'Irregular retainer payouts, co-working rents, software license charges.', transactions: ['UPI: ₹7,500 from Client B - DEPOSITED', 'UPI: ₹2,200 to Adobe Suite - APPROVED', 'UPI: ₹4,500 to WeWork Spaces - APPROVED', 'UPI: ₹380 to Cafe CCD - APPROVED', 'UPI: ₹950 to Zomato - APPROVED'], nudge: 'Kira Nudge: Software licenses and co-working rentals exceed this week\'s deposit inflows. Cash runway is currently 14 days. Action: Defer non-critical software upgrades until next retainer cleared.' },
  ];

  const runSimulation = (idx: number) => {
    if (simulating) return;
    setSimulating(true);
    setActivePersona(idx);
    setLogs([]);
    setActiveStep(null);
    setTypedNudge('');
    setPhoneState('lockscreen');

    const persona = personas[idx];
    const steps = [
      { msg: '[ParserNode] Ingested raw bank statement table keys.', active: 0 },
      { msg: '[ClassifierNode] Discretionary spending anomalies flagged.', active: 1 },
      { msg: '[RegressorNode] Calculated daily runway burn trajectory.', active: 2 },
      { msg: '[SupervisorNode] Routing audit check for tone compliance...', active: 3 },
    ];

    let currentStep = 0;
    const processStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setLogs(prev => [...prev, step.msg]);
        setActiveStep(step.active);
        currentStep++;
        setTimeout(processStep, 1000);
      } else {
        setSimulating(false);
        setPhoneState('homescreen');
        let charIndex = 0;
        const nudgeText = persona.nudge;
        const typeChar = () => {
          if (charIndex < nudgeText.length) {
            setTypedNudge(prev => prev + nudgeText.charAt(charIndex));
            charIndex++;
            setTimeout(typeChar, 14);
          }
        };
        typeChar();
      }
    };

    setLogs(['[ParserNode] Booting local sandbox agent pipeline...']);
    setTimeout(processStep, 700);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      id="simulator"
      style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}
    >
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '100px' }} />

      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '2px', border: '1px solid rgba(168,85,247,0.35)', padding: '4px 14px', borderRadius: '99px', background: 'rgba(168,85,247,0.08)', display: 'inline-block', marginBottom: '16px' }}>Interactive Agent Sandbox</div>
        <h2 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
          Live <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', background: 'linear-gradient(90deg,#a855f7,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>coaching simulator.</span>
        </h2>
        <p style={{ color: 'rgba(244,247,255,0.6)', fontSize: '17px', maxWidth: '580px', margin: '0 auto' }}>
          Pick a financial profile below to simulate the multi-agent cognitive loops and watch the WhatsApp message pop.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'stretch' }}>
        {/* Persona Cards */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          {personas.map((p, idx) => {
            const isActive = activePersona === idx;
            return (
              <motion.div key={p.id} onClick={() => runSimulation(idx)} whileHover={{ y: -2 }} style={{ background: isActive ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.02)', border: isActive ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: isActive ? '0 12px 30px rgba(168,85,247,0.15)' : 'none' }}>
                <div style={{ fontSize: '32px', width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>{p.avatar}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'white', fontFamily: 'Outfit, sans-serif' }}>{p.title}</h3>
                  <p style={{ color: 'rgba(244,247,255,0.5)', fontSize: '13.5px', margin: 0, lineHeight: 1.45 }}>{p.description}</p>
                </div>
                <ArrowRight size={18} color={isActive ? '#c084fc' : 'rgba(255,255,255,0.2)'} />
              </motion.div>
            );
          })}
        </div>

        {/* Simulator Workspace */}
        <div style={{ flex: 1.6, minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
          <SpotlightCard glowColor="rgba(168,85,247,0.12)" style={{ background: 'rgba(5,6,12,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(2,2,6,0.6)' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>kira-simulator-workspace - v3.0.0</div>
              <div style={{ width: '42px' }} />
            </div>

            <div className="workspace-split" style={{ display: 'flex', flexDirection: 'row', flex: 1, height: 'calc(100% - 40px)' }}>
              {/* Terminal */}
              <div style={{ flex: 1.2, padding: '24px', borderRight: '1px solid rgba(255,255,255,0.06)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', justifyContent: 'space-between', minHeight: '340px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    <span>PIPELINE_AGENT_STREAM</span>
                    <span style={{ color: activePersona !== null ? '#22c55e' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activePersona !== null ? '#22c55e' : 'rgba(255,255,255,0.3)' }} />
                      {activePersona !== null ? simulating ? 'PARSING' : 'CONNECTED' : 'STANDBY'}
                    </span>
                  </div>

                  {activePersona === null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', gap: '12px', padding: '40px 0' }}>
                      <Activity size={28} color="rgba(255,255,255,0.15)" />
                      <span>Select a profile card on the left to fire up the multi-agent nodes.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingested Statements</div>
                        {personas[activePersona].transactions.map((tx, idx) => (
                          <div key={idx} style={{ color: '#10b981', fontSize: '11.5px', opacity: 0.9 }}>&gt; {tx}</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '6px 0' }}>
                        {['Parser', 'Classifier', 'Regressor', 'Supervisor'].map((step, idx) => {
                          const isPassed = activeStep !== null && activeStep >= idx;
                          const isCurrent = activeStep === idx;
                          return (
                            <div key={step} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: isCurrent ? 'rgba(168,85,247,0.15)' : isPassed ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: isCurrent ? '1px solid #a855f7' : isPassed ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.05)', color: isCurrent ? '#c084fc' : isPassed ? '#4ade80' : 'rgba(255,255,255,0.45)', transition: 'all 0.3s' }}>{step}</div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {activePersona !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '12px' }}>
                    {logs.map((log, idx) => (
                      <div key={idx} style={{ color: log.includes('[SupervisorNode]') ? '#a855f7' : 'rgba(255,255,255,0.6)', fontSize: '11.5px' }}>{log}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone Mockup */}
              <div style={{ flex: 1, background: 'rgba(2,2,6,0.4)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
                <div style={{ width: '210px', height: '380px', borderRadius: '32px', border: '8px solid #27272a', background: '#03040a', overflow: 'hidden', position: 'relative', boxShadow: '0 15px 35px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', width: '50px', height: '11px', background: '#000', borderRadius: '99px', zIndex: 10, border: '1px solid rgba(255,255,255,0.08)' }} />

                  {phoneState === 'off' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', gap: '8px', padding: '20px' }}>
                      <span style={{ fontSize: '24px' }}>📴</span>
                      <span>Sandboxed Screen Standby</span>
                    </div>
                  )}

                  {phoneState === 'lockscreen' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center,rgba(168,85,247,0.18),transparent 75%)', padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', marginTop: '6px', padding: '0 4px' }}>
                        <span>5G</span>
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}><span>📶</span><span>🔋 88%</span></div>
                      </div>
                      <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif' }}>17:28</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'JetBrains Mono, monospace' }}>Tuesday, May 26</div>
                      </div>
                      <motion.div initial={{ scale: 0.88, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '16px', padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 2px 8px rgba(37,211,102,0.3)', flexShrink: 0 }}>💬</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ margin: 0, color: 'white', fontSize: '9.5px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Kira Budget Coach</h5>
                            <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>now</span>
                          </div>
                          <p style={{ margin: '1px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '8px', fontFamily: 'Outfit, sans-serif', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>Critical Money Runway warning...</p>
                        </div>
                      </motion.div>
                      <div style={{ textAlign: 'center', fontSize: '7.5px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>🔒 Slide to unlock</div>
                    </motion.div>
                  )}

                  {phoneState === 'homescreen' && (
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 180 }} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0b141a' }}>
                      <div style={{ background: '#128c7e', padding: '16px 12px 8px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                        <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '3px', borderRadius: '50%' }}>🤖</span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ color: 'white', margin: 0, fontSize: '10px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Kira Budget Coach</h4>
                          <span style={{ color: '#5bfb8a', fontSize: '7px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>online</span>
                        </div>
                      </div>
                      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'radial-gradient(circle at center,rgba(18,140,126,0.05),transparent 75%)', overflowY: 'auto' }}>
                        <motion.div initial={{ scale: 0.9, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 16 }} style={{ background: '#056162', color: 'white', padding: '8px 12px', borderRadius: '0px 12px 12px 12px', maxWidth: '90%', fontSize: '10.5px', lineHeight: 1.35, alignSelf: 'flex-start', boxShadow: '0 1.5px 3px rgba(0,0,0,0.18)' }}>
                          <p style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>{typedNudge || 'Routing Nudge...'}</p>
                          <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: '3px', fontFamily: 'JetBrains Mono, monospace' }}>
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ color: '#34b7f1', marginLeft: '3px' }}>✓✓</span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>

      <style>{`
        .workspace-split { display:flex; flex-direction:row; flex:1; }
        @media(max-width:900px){
          .workspace-split { flex-direction:column!important; }
          .workspace-split>div:first-child { border-right:none!important; border-bottom:1px solid rgba(255,255,255,0.06)!important; }
        }
      `}</style>
    </motion.section>
  );
};
