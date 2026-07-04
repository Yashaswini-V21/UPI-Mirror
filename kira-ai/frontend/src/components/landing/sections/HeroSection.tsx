import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowRight, Sparkles, Terminal, Zap } from 'lucide-react';
import { C } from '../DesignTokens';
import { MagneticButton } from '../primitives/MagneticButton';

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND CENTER DECK — 3D floating privacy cockpit
// ─────────────────────────────────────────────────────────────────────────────
interface CommandCenterDeckProps {
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  status: 'STANDBY' | 'INGESTING' | 'SECURED';
}

const CommandCenterDeck: React.FC<CommandCenterDeckProps> = ({ logs, setLogs, status }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (status !== 'STANDBY' || scanning) return;
    const stream = [
      'INGEST: raw statements in volatile RAM.',
      'DECODE: running local Regex scrubbing rules.',
      'REDISP: redacting transaction metadata...',
      'MASKING: Swiggy merchant -> MOCKED_FOOD',
      'MASKING: Uber merchant -> MOCKED_TRANSIT',
      'SECURE: UPI checksum SHA-256 verified.',
      'ROUTE: LangGraph supervisor routing logic.',
      'DISPATCH: lockscreen WhatsApp alert ready.',
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, `[wasm_dec] ${stream[i]}`];
        if (next.length > 5) next.shift();
        return next;
      });
      setActiveStep(s => (s + 1) % 4);
      i = (i + 1) % stream.length;
    }, 3200);
    return () => clearInterval(interval);
  }, [status, scanning]);

  const triggerScan = () => {
    if (scanning || status === 'INGESTING') return;
    setScanning(true);
    setLogs(prev => [...prev, 'SYSTEM: [!] MANUAL SCAN ACTIVATED [!]']);
    setTimeout(() => { setLogs(prev => [...prev, 'SYSTEM: checking SHA-256 integrity...']); }, 600);
    setTimeout(() => { setLogs(prev => [...prev, 'SYSTEM: volatile context scrubbed ✓']); }, 1400);
    setTimeout(() => {
      setLogs(prev => [...prev, 'SYSTEM: Diagnostic check passed. 100% Secure.']);
      setScanning(false);
    }, 2200);
  };

  const isScanning = scanning || status === 'INGESTING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10, rotateY: -15 }}
      animate={{
        opacity: 1,
        y: [0, -8, 0],
        rotateX: [10, 8, 10],
        rotateY: [-15, -12, -15],
        rotateZ: [1.5, 0.8, 1.5],
      }}
      transition={{
        opacity: { duration: 0.8 },
        y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        rotateX: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        rotateY: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        rotateZ: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
      }}
      style={{
        width: '100%',
        maxWidth: '480px',
        height: '460px',
        background: 'rgba(3, 3, 10, 0.82)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border:
          status === 'SECURED'
            ? '1px solid rgba(34, 197, 94, 0.5)'
            : status === 'INGESTING'
            ? '1px solid rgba(20, 184, 166, 0.5)'
            : '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '28px',
        padding: '24px',
        boxShadow:
          status === 'SECURED'
            ? '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(34, 197, 94, 0.15)'
            : '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(99, 102, 241, 0.15), inset 0 0 25px rgba(255,255,255,0.01)',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: 'perspective(1200px) rotateX(10deg) rotateY(-15deg) rotateZ(1.5deg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        transition: 'border-color 0.5s, box-shadow 0.5s',
      }}
    >
      {isScanning && (
        <motion.div
          initial={{ top: '0%' }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '4px',
            background:
              status === 'INGESTING'
                ? 'linear-gradient(90deg, transparent, #14b8a6, transparent)'
                : 'linear-gradient(90deg, transparent, #14b8a6, #6366f1, #14b8a6, transparent)',
            boxShadow: '0 0 15px #14b8a6, 0 0 5px #6366f1',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={12} color={C.indigo} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.textMuted, fontWeight: 700 }}>kira-privacy-vault://core-deck</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="animate-pulse" style={{ width: '5px', height: '5px', borderRadius: '50%', background: isScanning ? '#14b8a6' : status === 'SECURED' ? '#22c55e' : '#6366f1', boxShadow: isScanning ? '0 0 8px #14b8a6' : '0 0 8px #22c55e' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: isScanning ? '#14b8a6' : status === 'SECURED' ? '#22c55e' : '#6366f1', fontWeight: 800 }}>
            {status === 'INGESTING' ? 'INGESTING' : status === 'SECURED' ? 'SECURED ✓' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* HUD Visualizer */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '16px 0', zIndex: 2 }}>
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: status === 'SECURED' ? '1.5px dashed rgba(34,197,94,0.45)' : '1.5px dashed rgba(99,102,241,0.35)' }} />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', width: '80%', height: '80%', borderRadius: '50%', border: status === 'SECURED' ? '1.5px dotted rgba(34,197,94,0.35)' : '1.5px dotted rgba(20,184,166,0.4)' }} />
          <motion.div animate={{ scale: isScanning ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', width: '50%', height: '50%', borderRadius: '50%', background: status === 'SECURED' ? 'radial-gradient(circle,rgba(34,197,94,0.15),transparent 70%)' : 'radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)', border: status === 'SECURED' ? '1.5px solid rgba(34,197,94,0.6)' : '1.5px solid rgba(99,102,241,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: status === 'SECURED' ? '0 0 20px rgba(34,197,94,0.3)' : '0 0 15px rgba(99,102,241,0.2)' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: status === 'SECURED' ? 'linear-gradient(135deg,#22c55e,#10b981)' : 'linear-gradient(135deg,#14b8a6,#6366f1)', boxShadow: status === 'SECURED' ? '0 0 10px #22c55e' : '0 0 10px #14b8a6' }} />
          </motion.div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '160px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 14px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: C.textFaint }}>DECRYPT_THROUGHPUT</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: status === 'SECURED' ? '#22c55e' : '#14b8a6', fontWeight: 800, transition: 'color 0.3s' }}>
              {status === 'SECURED' ? '100% SECURED' : status === 'INGESTING' ? 'PROCESSING...' : '100% CLIENT_ONLY'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 14px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: C.textFaint }}>VOLATILE_MEMORY_TTL</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: C.pink, fontWeight: 800 }}>ZERO_RETENTION</span>
          </div>
          <motion.button whileHover={{ scale: isScanning ? 1 : 1.03, boxShadow: isScanning ? 'none' : '0 4px 12px rgba(20,184,166,0.3)' }} whileTap={{ scale: isScanning ? 1 : 0.98 }} onClick={triggerScan} disabled={isScanning} style={{ padding: '10px', borderRadius: '12px', background: isScanning ? 'rgba(20,184,166,0.1)' : 'rgba(99,102,241,0.1)', border: isScanning ? '1px solid rgba(20,184,166,0.4)' : '1px solid rgba(99,102,241,0.4)', color: isScanning ? '#14b8a6' : C.indigo, fontFamily: 'JetBrains Mono, monospace', fontSize: '9.5px', fontWeight: 800, cursor: isScanning ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
            <Activity size={12} className={isScanning ? 'animate-pulse' : ''} />
            {status === 'INGESTING' ? 'INGESTING...' : scanning ? 'AUDITING...' : 'RUN SECURITY CHECK'}
          </motion.button>
        </div>
      </div>

      {/* Log Ticker */}
      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '130px', zIndex: 2 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7.5px', color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>VOLATILE COCKPIT TRACE</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
          {logs.map((log, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ color: log.includes('SYSTEM') ? '#ffbd2e' : log.includes('Secure') || log.includes('passed') || log.includes('SECURED') ? '#22c55e' : 'rgba(250,250,250,0.65)', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.3 }}>
              <span style={{ color: C.indigo }}>&gt;</span>
              <span>{log}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────
interface HeroSectionProps { onStart?: () => void; }

export const HeroSection: React.FC<HeroSectionProps> = ({ onStart }) => {
  const [pipelineStatus, setPipelineStatus] = useState<'STANDBY' | 'INGESTING' | 'SECURED'>('STANDBY');
  const [activeLogs, setActiveLogs] = useState<string[]>([
    'INIT: Isolated WASM sandbox active.',
    'SCAN: Awaiting browser statement upload...',
  ]);
  const [triggerPulse, setTriggerPulse] = useState(false);
  const [activeTab, setActiveTab] = useState<'PDF' | 'CSV' | 'SMS'>('PDF');
  const [scrubLevel, setScrubLevel] = useState(100);

  const selectPipeline = (source: string, level: number = 100) => {
    if (pipelineStatus === 'INGESTING') return;
    setPipelineStatus('INGESTING');
    setTriggerPulse(true);
    setActiveLogs(prev => { const next = [...prev, `[wasm_dec] INGEST: [${source}] payload loaded in local RAM.`]; if (next.length > 5) next.shift(); return next; });
    setTimeout(() => {
      setActiveLogs(prev => {
        const levelMsg = level === 100 ? `[wasm_dec] TOTAL SCRUB: All identifiers scrubbed to zero.` : level <= 50 ? `[wasm_dec] SHIELDED MODE: Primary identifiers partially scrubbed.` : `[wasm_dec] WARNING: Minimal scrub activated.`;
        const next = [...prev, `[wasm_dec] DECODE: running Regex rules...`, levelMsg];
        while (next.length > 5) next.shift();
        return next;
      });
    }, 750);
    setTimeout(() => {
      setActiveLogs(prev => { const next = [...prev, `[wasm_dec] SECURED: [${source}] all records scrubbed.`]; if (next.length > 5) next.shift(); return next; });
      setPipelineStatus('SECURED');
      setTriggerPulse(false);
    }, 1800);
  };

  const getMaskedText = (tab: 'PDF' | 'CSV' | 'SMS', level: number): string => {
    if (tab === 'PDF') {
      if (level === 0) return 'ACC: 4892-2901-5521 / BAL: ₹4,18,920.00 / UPI: 882910@ybl / FOOD: SWIGGY-REST';
      if (level <= 50) return 'ACC: 4892-2901-**** / BAL: ₹4,18,920.00 / UPI: 882910@ybl / FOOD: MOCKED_FOOD';
      return 'ACC: ****-****-**** / BAL: [REDACTED] / UPI: [SCRUBBED] / FOOD: MOCKED_FOOD';
    } else if (tab === 'CSV') {
      if (level === 0) return 'TxID: 99201982, Merchant: ZOMATO-FOOD-DELIVERY, Card: 4111-2290-0982-9918, Amt: ₹850';
      if (level <= 50) return 'TxID: 99201982, Merchant: ZOMATO-FOOD, Card: ****-****-****-9918, Amt: ₹850';
      return 'TxID: [SCRUBBED], Merchant: MOCKED_FOOD, Card: ****-****-****-****, Amt: ₹850';
    } else {
      if (level === 0) return 'Debited: ₹649 for Netflix subscription. A/c ending 1928. Ref: UPI/66201';
      if (level <= 50) return 'Debited: ₹649 for Netflix subscription. A/c ending ****. Ref: UPI/66201';
      return 'Debited: ₹649 for MOCKED_SUB. A/c ending ****. Ref: [REDACTED]';
    }
  };

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '110px', position: 'relative', zIndex: 1, padding: '120px 24px 80px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10%', top: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle,rgba(99,102,241,0.14),transparent 70%)', filter: 'blur(110px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', left: '-5%', bottom: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle,rgba(20,184,166,0.08),transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div className="hero-row" style={{ display: 'flex', alignItems: 'center', gap: '50px', flexWrap: 'wrap', width: '100%' }}>

          {/* Left: WASM Sandbox Dock */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '99px', border: `1px solid rgba(99,102,241,0.3)`, background: 'rgba(99,102,241,0.08)', marginBottom: '24px' }}>
              <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.indigo, boxShadow: `0 0 8px ${C.indigo}` }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9.5px', fontWeight: 800, color: 'white', letterSpacing: '0.08em' }}>KIRA_ENGINE_V3.0 // ACTIVE</span>
            </motion.div>

            <h1 style={{ fontSize: 'clamp(2.5rem,5.5vw,4.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', margin: '0 0 24px 0', fontFamily: 'Outfit, sans-serif', color: 'white' }}>
              Private Financial <br />
              <span style={{ background: C.gradH, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shiny-anim 6s linear infinite', backgroundSize: '200% auto' }}>Intelligence.</span>
            </h1>

            <p style={{ fontSize: '16.5px', color: C.textMuted, lineHeight: 1.65, margin: '0 0 36px 0', fontFamily: 'Outfit, sans-serif', maxWidth: '560px' }}>
              Kira decodes bank statements locally, scrubs transaction IDs in WebAssembly sandboxes, maps metrics with LangGraph supervisor logic, and routes actionable WhatsApp alerts.
            </p>

            {/* WASM Sandbox Privacy Core Dock */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(5,5,14,0.65)', border: `1px solid rgba(20,184,166,0.22)`, borderRadius: '24px', padding: '22px', width: '100%', maxWidth: '560px', marginBottom: '36px', backdropFilter: 'blur(28px)', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5),inset 0 0 20px rgba(20,184,166,0.04)' }}>
              <AnimatePresence>
                {triggerPulse && (
                  <motion.div initial={{ x: 50, y: 120, opacity: 0, scale: 0.5 }} animate={{ x: [50, 480], y: [120, -50, 60], opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.6] }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: 'easeInOut' }} style={{ position: 'absolute', width: '14px', height: '14px', borderRadius: '50%', background: 'radial-gradient(circle,#14b8a6 0%,#6366f1 100%)', boxShadow: '0 0 15px #14b8a6,0 0 30px #6366f1', zIndex: 999, pointerEvents: 'none' }} />
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.textFaint, fontWeight: 700, letterSpacing: '0.08em' }}>WASM LOCAL SANDBOX // ROUTING BAY</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8.5px', color: pipelineStatus === 'SECURED' ? '#22c55e' : pipelineStatus === 'INGESTING' ? '#14b8a6' : C.textFaint, fontWeight: 800 }}>STATUS: {pipelineStatus}</span>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {(['PDF', 'CSV', 'SMS'] as const).map(tab => {
                  const isActive = activeTab === tab;
                  const colors = { PDF: '#14b8a6', CSV: '#6366f1', SMS: '#ec4899' };
                  return (
                    <button key={tab} onClick={() => { if (pipelineStatus !== 'INGESTING') setActiveTab(tab); }} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent', border: isActive ? `1px solid ${colors[tab]}40` : '1px solid transparent', color: isActive ? 'white' : 'rgba(200,210,255,0.6)', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '12px', cursor: pipelineStatus === 'INGESTING' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.25s', boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.25),inset 0 1px 1px rgba(255,255,255,0.05)' : 'none' }}>
                      <span>{tab === 'PDF' ? '📄 PDF' : tab === 'CSV' ? '📊 CSV' : '💬 SMS'}</span>
                    </button>
                  );
                })}
              </div>

              {/* File Info Dock */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{activeTab === 'PDF' ? '📄' : activeTab === 'CSV' ? '📊' : '💬'}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'white', fontFamily: 'Outfit, sans-serif' }}>{activeTab === 'PDF' ? 'statement_q2_raw.pdf' : activeTab === 'CSV' ? 'ledger_export_q2.csv' : 'transaction_sms.txt'}</span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: C.textFaint }}>{activeTab === 'PDF' ? '142.4 KB' : activeTab === 'CSV' ? '88.1 KB' : '1.2 KB'}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#f87171', fontWeight: 800 }}>[IN MEMORY RAW BUFFER]</span>
                      <span className="animate-pulse" style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#f87171', fontWeight: 800 }}>EXPOSED</span>
                    </div>
                    <div style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '8px', padding: '8px 10px', fontSize: '9.5px', fontFamily: 'JetBrains Mono, monospace', color: '#fca5a5', wordBreak: 'break-all', lineHeight: 1.3 }}>
                      {activeTab === 'PDF' ? 'ACC: 4892-2901-5521 / BAL: ₹4,18,920.00 / UPI: 882910@ybl / FOOD: SWIGGY-REST' : activeTab === 'CSV' ? 'TxID: 99201982, Merchant: ZOMATO-FOOD-DELIVERY, Card: 4111-2290-0982-9918, Amt: ₹850' : 'Debited: ₹649 for Netflix subscription. A/c ending 1928. Ref: UPI/66201'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#14b8a6', fontWeight: 800 }}>[SCRUBBED LOCAL BUFFER]</span>
                      <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#14b8a6', fontWeight: 800 }}>{scrubLevel === 100 ? 'SECURED (100%)' : scrubLevel === 50 ? 'PARTIAL (50%)' : 'MINIMAL'}</span>
                    </div>
                    <div style={{ background: 'rgba(20,184,166,0.03)', border: `1px solid rgba(20,184,166,0.15)`, borderRadius: '8px', padding: '8px 10px', fontSize: '9.5px', fontFamily: 'JetBrains Mono, monospace', color: '#2dd4bf', wordBreak: 'break-all', lineHeight: 1.3, boxShadow: 'inset 0 0 10px rgba(20,184,166,0.02)' }}>
                      {getMaskedText(activeTab, scrubLevel)}
                    </div>
                  </div>
                </div>

                {/* Redaction Depth Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white' }}>De-identification Depth</span>
                    <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: scrubLevel === 100 ? '#14b8a6' : scrubLevel === 50 ? '#6366f1' : '#ec4899', fontWeight: 800 }}>{scrubLevel}% REDACTED</span>
                  </div>
                  <input type="range" min="0" max="100" step="50" value={scrubLevel} onChange={e => { if (pipelineStatus !== 'INGESTING') setScrubLevel(Number(e.target.value)); }} disabled={pipelineStatus === 'INGESTING'} style={{ width: '100%', accentColor: '#14b8a6', height: '4px', borderRadius: '99px', outline: 'none', cursor: pipelineStatus === 'INGESTING' ? 'default' : 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: C.textFaint }}>
                    <span>0% MINIMAL</span><span>50% SHIELDED</span><span>100% SECURE</span>
                  </div>
                </div>
              </div>

              <motion.button whileHover={{ scale: pipelineStatus === 'INGESTING' ? 1 : 1.02 }} whileTap={{ scale: pipelineStatus === 'INGESTING' ? 1 : 0.98 }} onClick={() => selectPipeline(activeTab, scrubLevel)} disabled={pipelineStatus === 'INGESTING'} style={{ width: '100%', padding: '14px', borderRadius: '14px', background: pipelineStatus === 'INGESTING' ? 'rgba(255,255,255,0.03)' : pipelineStatus === 'SECURED' ? 'rgba(34,197,94,0.15)' : 'rgba(20,184,166,0.12)', border: pipelineStatus === 'INGESTING' ? '1px solid rgba(255,255,255,0.08)' : pipelineStatus === 'SECURED' ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(20,184,166,0.45)', color: pipelineStatus === 'SECURED' ? '#4ade80' : '#2dd4bf', fontSize: '12.5px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, cursor: pipelineStatus === 'INGESTING' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s', boxShadow: pipelineStatus === 'SECURED' ? '0 4px 16px rgba(34,197,94,0.1)' : 'none' }}>
                <Zap size={14} className={pipelineStatus === 'INGESTING' ? 'animate-spin' : ''} />
                {pipelineStatus === 'INGESTING' ? 'COMMITTING CLIENT MASKING...' : pipelineStatus === 'SECURED' ? 'SECURE FLOW ROUTED ✓' : 'INGEST & RUN DE-IDENTIFICATION'}
              </motion.button>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                {[{ label: 'LOCAL_LATENCY', val: '< 0.4ms', color: '#14b8a6' }, { label: 'RETENTION_TTL', val: '0ms // RAM', color: C.pink }, { label: 'ANONYMITY_IDX', val: scrubLevel === 100 ? '99.8%' : scrubLevel === 50 ? '78.5%' : '24.1%', color: '#a7f3d0' }].map(s => (
                  <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                    <span style={{ fontSize: '7px', fontFamily: 'JetBrains Mono, monospace', color: C.textFaint }}>{s.label}</span>
                    <span style={{ fontSize: '10.5px', fontFamily: 'JetBrains Mono, monospace', color: s.color, fontWeight: 800 }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <MagneticButton onClick={onStart}>
                <div style={{ padding: '16px 36px', fontSize: '15px', background: C.grad, borderRadius: '99px', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 30px rgba(99,102,241,0.45)', fontFamily: 'Outfit, sans-serif' }}>
                  Launch Dashboard <ArrowRight size={18} />
                </div>
              </MagneticButton>
              <button onClick={() => document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '16px 34px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px', color: 'white', fontWeight: 700, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                Zero-Knowledge Sandbox <Sparkles size={15} color={C.teal} />
              </button>
            </div>
          </div>

          {/* Right: 3D Cockpit */}
          <div style={{ flex: '1 1 450px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CommandCenterDeck logs={activeLogs} setLogs={setActiveLogs} status={pipelineStatus} />
          </div>
        </div>
      </div>

      <style>{`
        .hero-row { display:flex; flex-direction:row; }
        @media(max-width:991px){
          .hero-row { flex-direction:column!important; gap:80px!important; }
          .hero-row > div { width:100%!important; text-align:center!important; align-items:center!important; }
        }
      `}</style>
    </section>
  );
};
