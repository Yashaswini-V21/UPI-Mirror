import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, Area, Tooltip } from 'recharts';
import { GlassCard, StatusBadge, KiraButton } from '../ui';
import { useCountUp } from '../../hooks/useCountUp';
import { useKiraStore } from '../../store/useKiraStore';

// ── Custom Tooltip for Savings Chart ───────────────────────────────────────
const SavingsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <GlassCard padding="sm" style={{ background: 'rgba(3,4,10,0.96)', minWidth: '150px', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Month {label}</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600, color: '#14b8a6' }}>
        ₹{Math.round(payload[0].value).toLocaleString('en-IN')}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
        Projected Savings
      </div>
    </GlassCard>
  );
};

export const ImpactTab = () => {
  const { coachData, session } = useKiraStore();
  const confidence = coachData?.confidence ?? 94;
  const daysLeft   = coachData?.runwayDays  ?? 12;
  const suggestedCap = coachData?.suggestedCap ?? 15000;
  const burnRate = coachData?.burnRateDaily ?? 1250;

  const data = {
    confidence,
    daysLeft,
    cap: suggestedCap,
    nudgeLogged: true,
    history: [
      { id: '1', date: 'Today, 9:00 AM', category: 'Food Delivery', daysLeft, narrative: 'Detected high spending in Food Delivery. Recommended reducing frequency to extend runway.' },
      { id: '2', date: 'May 20, 2:15 PM', category: 'Shopping', daysLeft: 18, narrative: 'Spike in E-commerce shopping. Advised holding off on non-essential purchases this week.' }
    ],
    achievements: [
      { id: '1', name: 'First Coach',   icon: '🎯', unlocked: true,  isNew: false },
      { id: '2', name: 'Data Rich',     icon: '📊', unlocked: true,  isNew: false },
      { id: '3', name: 'Action Taker',  icon: '✅', unlocked: true,  isNew: true  },
      { id: '4', name: 'Forecaster',    icon: '🔮', unlocked: !!session, isNew: false },
      { id: '5', name: 'Global User',   icon: '🌍', unlocked: true,  isNew: false }
    ],
    modelHealth: [
      { name: 'Mean Absolute Error', value: 88 },
      { name: 'Signal Coverage',     value: 95 },
      { name: 'Nudge Acceptance',    value: 64 },
      { name: 'Overall Score',       value: 92 }
    ]
  };

  const confCount = useCountUp(data.confidence);
  const colorDays = data.daysLeft > 14 ? '#22c55e' : data.daysLeft >= 7 ? '#f59e0b' : '#ef4444';
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [healthOpen, setHealthOpen] = useState(false);

  // Generate 12 months savings projections (assuming a ₹1,500 monthly cutback compounding at 6% annually)
  const savingsData = useMemo(() => {
    const monthlyContribution = suggestedCap * 0.15; // Assume saving 15% of suggested cap
    const annualRate = 0.06; // 6% annual return
    const monthlyRate = annualRate / 12;
    let balance = 0;
    
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      balance = (balance + monthlyContribution) * (1 + monthlyRate);
      return {
        month,
        "Savings": Math.round(balance)
      };
    });
  }, [suggestedCap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* SESSION METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
        <GlassCard padding="sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '28px', color: '#14b8a6' }}>{confCount}%</div>
            <div style={{ width: '24px', height: '24px' }}>
              <svg viewBox="0 0 24 24" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <motion.circle cx="12" cy="12" r="10" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeDasharray="62.8" initial={{ strokeDashoffset: 62.8 }} animate={{ strokeDashoffset: 62.8 - (62.8 * data.confidence / 100) }} transition={{ duration: 1.2 }} />
              </svg>
            </div>
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Confidence</div>
        </GlassCard>

        <GlassCard padding="sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '28px', color: colorDays }}>{data.daysLeft}</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Days Remaining</div>
        </GlassCard>

        <GlassCard padding="sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '22px', color: 'white' }}>₹{new Intl.NumberFormat('en-IN').format(data.cap)}</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Suggested Cap</div>
        </GlassCard>

        <GlassCard padding="sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: data.nudgeLogged ? '#22c55e' : '#f59e0b' }}>
            {data.nudgeLogged ? 'Logged ✓' : 'Pending'}
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Nudge Status</div>
        </GlassCard>
      </div>

      {/* SAVINGS PROJECTION CHART */}
      <GlassCard padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 600, color: 'white' }}>Compound Savings projection</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>12-MONTH POTENTIAL AT 6% P.A.</div>
          </div>
          <span style={{ fontSize: '18px' }}>💰</span>
        </div>
        
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={savingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="savings-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 8" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontFamily: 'Outfit', fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
              <YAxis tickLine={false} axisLine={false} width={65} tickFormatter={v => `₹${v.toLocaleString('en-IN')}`} tick={{ fontFamily: 'Outfit', fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
              <Tooltip content={<SavingsTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="Savings" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#savings-gradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* ACHIEVEMENT BADGES */}
      <GlassCard>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Achievements</div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between', overflowX: 'auto', paddingBottom: '8px' }}>
          {data.achievements.map((badge, i) => (
            <div key={badge.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '60px' }}>
              <motion.div
                initial={badge.isNew ? { scale: 0 } : { scale: 1 }}
                animate={badge.isNew ? { scale: [1, 1.4, 1], filter: 'drop-shadow(0 0 16px rgba(20,184,166,0.8))' } : { scale: 1 }}
                transition={{ duration: 0.6, delay: badge.isNew ? 0.5 : 0 }}
                style={{
                  width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                  filter: badge.unlocked ? (badge.isNew ? 'none' : 'drop-shadow(0 0 4px rgba(255,255,255,0.1))') : 'grayscale(100%) blur(0.5px)',
                  opacity: badge.unlocked ? 1 : 0.3
                }}
              >
                {badge.icon}
              </motion.div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', color: badge.unlocked ? 'white' : 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.2 }}>
                {badge.name}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* SESSION HISTORY */}
      <GlassCard>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Your coaching history</div>
        
        {data.history.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', marginTop: '12px' }}>Your history will appear here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.history.map((item, i) => (
              <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StatusBadge status={item.daysLeft < 7 ? 'critical' : item.daysLeft <= 14 ? 'watch' : 'stable'} />
                    <div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 500, color: 'white' }}>{item.category}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{item.date}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{item.daysLeft} days</div>
                    <motion.span aria-hidden="true" animate={{ rotate: expandedId === item.id ? 180 : 0 }} style={{ display: 'inline-flex', transformOrigin: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></motion.span>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 16px 16px 16px', fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                        {item.narrative}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* EXPORT SECTION */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <KiraButton variant="ghost" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ marginRight: '8px' }}>📊</span> Export to Sheets
        </KiraButton>
        <KiraButton variant="ghost" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ marginRight: '8px' }}>📥</span> Download Report
        </KiraButton>
      </div>

      {/* MODEL HEALTH */}
      <GlassCard padding="sm">
        <div 
          onClick={() => setHealthOpen(!healthOpen)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 4px' }}
        >
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Kira's model health</div>
          <motion.div animate={{ rotate: healthOpen ? 180 : 0 }} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </motion.div>
        </div>
        
        <AnimatePresence>
          {healthOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.modelHealth.map((q, i) => (
                  <div key={q.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{q.name}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>{q.value}/100</div>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${q.value}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ height: '100%', background: '#14b8a6', borderRadius: '99px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

    </div>
  );
};
