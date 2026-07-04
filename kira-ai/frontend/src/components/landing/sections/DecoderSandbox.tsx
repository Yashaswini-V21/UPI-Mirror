import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Database, Shield, Zap } from 'lucide-react';
import { C } from '../DesignTokens';

interface TxItem {
  raw: string;
  masked: string;
  category: string;
  amount: string;
  confidence: number;
  icon: React.FC<any>;
  color: string;
  logs: string[];
}

export const DecoderSandbox: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayMasked, setDisplayMasked] = useState('');
  const [isMasking, setIsMasking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const transactions: TxItem[] = [
    { raw: 'UPI/20260531/SWIGGY-REST-BANGALORE/882901/1420.00/DR', masked: 'UPI/20260531/*********_FOOD_DELIVERY/******/******/DR', category: 'Food Delivery', amount: '₹1,420.00', confidence: 98, icon: Database, color: '#ec4899', logs: ['Ingesting raw direct UPI string from browser memory...', 'Running client regex redaction rules (No cloud transmission)', 'Merchant signature detected: "SWIGGY-REST"', 'Successfully scrubbed merchant ID and metadata tags.', 'Token categorized under Food Delivery with 98% confidence.'] },
    { raw: 'UPI/20260530/UBER-RIDE-HSR-TOWN/129302/380.00/DR', masked: 'UPI/20260530/*********_MICRO_TRANSIT/******/******/DR', category: 'Micro-Transit', amount: '₹380.00', confidence: 99, icon: Zap, color: '#14b8a6', logs: ['Ingesting raw direct UPI string from browser memory...', 'Running client regex redaction rules (No cloud transmission)', 'Merchant signature detected: "UBER-RIDE"', 'Successfully scrubbed merchant ID and GPS location strings.', 'Token categorized under Micro-Transit with 99% confidence.'] },
    { raw: 'UPI/20260529/AMZN-IN-MARKETPLACE/492100/2100.00/DR', masked: 'UPI/20260529/*********_RETAIL_SHOPPING/******/******/DR', category: 'Shopping', amount: '₹2,100.00', confidence: 94, icon: Shield, color: '#6366f1', logs: ['Ingesting raw direct UPI string from browser memory...', 'Running client regex redaction rules (No cloud transmission)', 'Merchant signature detected: "AMZN-IN"', 'Successfully scrubbed marketplace seller data and order IDs.', 'Token categorized under Retail Shopping with 94% confidence.'] },
  ];

  useEffect(() => {
    if (!inView) return;
    setDisplayMasked('');
    setIsMasking(true);
    const t = transactions[activeIdx];
    let i = 0;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$%#@!*&/';
    const iv = setInterval(() => {
      setDisplayMasked(t.masked.split('').map((c, idx) => {
        if (c === '/') return '/';
        if (idx < i) return t.masked[idx];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      if (i >= t.masked.length) { clearInterval(iv); setDisplayMasked(t.masked); setIsMasking(false); }
      i++;
    }, 18);
    return () => clearInterval(iv);
  }, [activeIdx, inView]);

  const tx = transactions[activeIdx];
  const Icon = tx.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8 }}
      id="decoder"
      style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}
    >
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(20,184,166,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(20,184,166,0.07)', display: 'inline-block', marginBottom: '16px' }}>Zero-Knowledge Privacy Engine</motion.div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: '0 0 16px 0' }}>
          Watch the de-identification{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', color: C.teal }}>live.</span>
        </h2>
        <p style={{ color: C.textMuted, fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Click any transaction below to watch Kira's client-side regex engine scrub identifiers in real time — no data ever leaves your browser.
        </p>
      </div>

      <div ref={ref} style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Transaction Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '0 0 300px' }}>
          {transactions.map((t, idx) => {
            const TIcon = t.icon;
            const isActive = activeIdx === idx;
            return (
              <motion.div key={idx} whileHover={{ y: -2 }} onClick={() => { if (!isMasking) setActiveIdx(idx); }} style={{ background: isActive ? `${t.color}12` : 'rgba(255,255,255,0.02)', border: isActive ? `1px solid ${t.color}50` : '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '18px 20px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', boxShadow: isActive ? `0 8px 28px rgba(0,0,0,0.4),0 0 20px ${t.color}15` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${t.color}15`, border: `1px solid ${t.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TIcon size={16} color={t.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13.5px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>{t.category}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: t.color, fontWeight: 700 }}>{t.amount} • {t.confidence}% confidence</div>
                  </div>
                  {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.color, boxShadow: `0 0 8px ${t.color}`, flexShrink: 0 }} />}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live Decoder Panel */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(5,5,14,0.7)', border: `1px solid ${tx.color}25`, borderRadius: '24px', padding: '28px', backdropFilter: 'blur(24px)', boxShadow: `0 20px 60px rgba(0,0,0,0.5),0 0 30px ${tx.color}10` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.textFaint }}>kira-decoder://sandbox</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#f87171', fontWeight: 800 }}>RAW UPI STRING</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#f87171' }}>⚠ EXPOSED</span>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#fca5a5', wordBreak: 'break-all', lineHeight: 1.4 }}>{tx.raw}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.textFaint }}>
                <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg,transparent,${tx.color}40)` }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: tx.color, fontWeight: 700, fontSize: '9px' }}>REGEX_SCRUB_ENGINE</span>
                <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg,${tx.color}40,transparent)` }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: tx.color, fontWeight: 800 }}>MASKED OUTPUT</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: tx.color }}>✓ SECURE</span>
                </div>
                <div style={{ background: `${tx.color}06`, border: `1px solid ${tx.color}22`, borderRadius: '10px', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: tx.color, wordBreak: 'break-all', lineHeight: 1.4, minHeight: '44px', boxShadow: `inset 0 0 12px ${tx.color}08` }}>{displayMasked || tx.masked}</div>
              </div>
            </div>

            {/* Process Logs */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: C.textFaint, textTransform: 'uppercase', marginBottom: '4px' }}>Process Log</span>
              {tx.logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: i === tx.logs.length - 1 ? '#22c55e' : 'rgba(255,255,255,0.5)', display: 'flex', gap: '6px' }}>
                  <span style={{ color: tx.color }}>&gt;</span> {log}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
