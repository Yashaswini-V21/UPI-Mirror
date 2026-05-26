import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, Area, ReferenceLine, Tooltip } from 'recharts';
import { GlassCard, KiraSkeleton } from '../ui';
import { useCountUp } from '../../hooks/useCountUp';
import { useDebounce } from '../../hooks/useDebounce';
import { useKiraStore } from '../../store/useKiraStore';

// ── SVG Progress Ring (no external dep) ────────────────────────────────────
const ProgressRing = ({ value, color, size = 80, stroke = 6 }: { value: number; color: string; size?: number; stroke?: number }) => {
  const r = (size / 2) - stroke;
  const cx = size / 2;
  return (
    <div style={{ position: 'relative', width: size, height: size }} role="img" aria-label={`${Math.round(value)}%`}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.min(value / 100, 1) }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontSize: `${size * 0.16}px`, fontWeight: 600, color: 'white',
      }}>
        {Math.round(value)}%
      </div>
    </div>
  );
};

// ── SVG Sparkline ────────────────────────────────────────────────────────────
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 60},${30 - ((d - min) / range) * 28}`).join(' ');
  return (
    <svg width="60" height="30" viewBox="0 0 60 30" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const bal = payload[0].value as number;
  return (
    <GlassCard padding="sm" style={{ background: 'rgba(3,4,10,0.92)', minWidth: '130px', pointerEvents: 'none' }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Day {label}</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 600, color: 'white' }}>₹{bal.toLocaleString('en-IN')}</div>
      {bal <= 500 && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>⚠ Broke approaching</div>}
    </GlassCard>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const ForecastTab = ({ loading: loadingProp }: { loading?: boolean }) => {
  const { coachData, coachLoading } = useKiraStore();
  const loading = loadingProp ?? coachLoading;

  // Chart data generated ONCE with useMemo — not on every render
  const burnRate = coachData?.burnRateDaily ?? 1250;
  const daysLeft = coachData?.runwayDays ?? 12;
  const confidence = (coachData?.confidence ?? 85);
  const topCategory = coachData?.topCategory ?? 'Food Delivery';

  const chartData = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      balance: Math.max(0, Math.round(15000 - i * burnRate + (Math.sin(i * 0.7) * 300))),
    }))
  , [burnRate]);

  const daysCount  = useCountUp(daysLeft);
  const burnCount  = useCountUp(burnRate);

  const [budget, setBudget]   = useState(15000);
  const [cutback, setCutback] = useState(0);
  const debouncedBudget  = useDebounce(budget, 400);
  const debouncedCutback = useDebounce(cutback, 400);
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    setIsRefetching(true);
    const t = setTimeout(() => setIsRefetching(false), 700);
    return () => clearTimeout(t);
  }, [debouncedBudget, debouncedCutback]);

  // Optimistic scenario calculation
  const effectiveBurnRate = burnRate * (1 - debouncedCutback / 100);
  const optimisticDays = effectiveBurnRate > 0 ? Math.floor(debouncedBudget / effectiveBurnRate) : 99;
  const diffDays = optimisticDays - daysLeft;

  const colorDays = daysLeft > 14 ? '#22c55e' : daysLeft >= 7 ? '#f59e0b' : '#ef4444';
  const colorConf = confidence > 70 ? '#22c55e' : confidence >= 40 ? '#f59e0b' : '#ef4444';

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <KiraSkeleton height={130} variant="card" />
          <KiraSkeleton height={130} variant="card" />
          <KiraSkeleton height={130} variant="card" />
        </div>
        <KiraSkeleton height={300} variant="card" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <style>{`
        .kira-range::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #a855f7; box-shadow: 0 0 10px rgba(168,85,247,0.7); cursor: pointer; transition: transform 0.1s; }
        .kira-range::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .kira-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #a855f7; border: none; cursor: pointer; box-shadow: 0 0 10px rgba(168,85,247,0.7); }
        .kira-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; }
      `}</style>

      {/* HEADER METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '32px', color: colorDays }} aria-label={`${daysLeft} days left`}>{daysCount}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Days Left</div>
            </div>
            <ProgressRing value={(daysLeft / 30) * 100} color={colorDays} size={56} stroke={4} />
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '24px', color: 'white' }} aria-label={`Daily burn rate: ₹${burnRate.toLocaleString('en-IN')}`}>
                ₹{burnCount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Daily Burn</div>
            </div>
            <Sparkline data={[1200, 1350, 1100, 1500, 1250, 1400, burnRate]} color="#3b82f6" />
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '24px', color: 'white' }}>{confidence}%</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Confidence</div>
            </div>
            <ProgressRing value={confidence} color={colorConf} size={56} stroke={4} />
          </div>
        </GlassCard>
      </div>

      {/* CHART */}
      <GlassCard padding="lg" style={{ position: 'relative' }}>
        <AnimatePresence>
          {isRefetching && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              aria-label="Recalculating forecast…"
              aria-live="polite"
              style={{ position: 'absolute', inset: 0, background: 'rgba(3,4,10,0.6)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-xl, 16px)' }}
            >
              <span aria-hidden="true" className="animate-spin" style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#22c55e', borderRadius: '50%' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '20px' }}>
          Runway Projection
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fg-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 8" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontFamily: 'Outfit', fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
              <YAxis tickLine={false} axisLine={false} width={70} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontFamily: 'Outfit', fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="6 4" strokeWidth={1} />
              <ReferenceLine
                x={daysLeft}
                stroke="rgba(239,68,68,0.5)"
                strokeDasharray="3 3"
                label={{ position: 'top', value: 'BROKE', fill: '#ef4444', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#fg-balance)" dot={false} animationDuration={900} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* SCENARIO SLIDERS */}
      <GlassCard>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 600, color: 'white' }}>What if I changed my spending?</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', textTransform: 'uppercase' }}>Scenario Simulator</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Budget slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label htmlFor="budget-slider" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Monthly Budget</label>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600, color: 'white' }}>₹{budget.toLocaleString('en-IN')} / mo</span>
            </div>
            <input
              id="budget-slider"
              type="range" min="1000" max="100000" step="500" value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="kira-range"
              aria-label={`Monthly budget: ₹${budget.toLocaleString('en-IN')}`}
              style={{
                width: '100%',
                background: `linear-gradient(to right, #22c55e ${((budget - 1000) / 99000) * 100}%, rgba(255,255,255,0.1) 0%)`,
              }}
            />
          </div>

          {/* Cutback slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label htmlFor="cutback-slider" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                Cut <span style={{ color: '#a855f7' }}>{topCategory}</span> spending
              </label>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600, color: 'white' }}>{cutback}%</span>
            </div>
            <input
              id="cutback-slider"
              type="range" min="0" max="80" step="5" value={cutback}
              onChange={e => setCutback(Number(e.target.value))}
              className="kira-range"
              aria-label={`Reduce ${topCategory} by ${cutback}%`}
              style={{
                width: '100%',
                background: `linear-gradient(to right, #a855f7 ${(cutback / 80) * 100}%, rgba(255,255,255,0.1) 0%)`,
              }}
            />
          </div>

          {/* Result */}
          <div
            role="status"
            aria-live="polite"
            style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
              With this change: broke-date moves to Day {optimisticDays}{' '}
            </span>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: diffDays > 0 ? '#22c55e' : diffDays < 0 ? '#ef4444' : '#f59e0b' }}>
              ({diffDays > 0 ? '+' : ''}{diffDays} days)
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
