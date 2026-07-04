import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DayData {
  date: string;
  score: number; // 0-5
  amount: number;
  category: string;
}

// Generate realistic demo data for 12 weeks
function generateHeatmapData(): DayData[] {
  const data: DayData[] = [];
  const categories = ['Food Delivery', 'Shopping', 'Transit', 'Subscriptions', 'Cafes', 'Entertainment'];
  const now = new Date();

  for (let i = 83; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Weekends and Fridays have higher regret scores
    const baseScore = isWeekend ? 2.5 + Math.random() * 2.5 : Math.random() * 3.5;
    const score = Math.min(5, Math.max(0, baseScore + (dayOfWeek === 5 ? 1 : 0)));

    // Some days have no spending
    if (Math.random() < 0.08) {
      data.push({ date: date.toISOString().split('T')[0], score: 0, amount: 0, category: '-' });
    } else {
      data.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(score * 10) / 10,
        amount: Math.round(200 + score * 400 + Math.random() * 300),
        category: categories[Math.floor(Math.random() * categories.length)],
      });
    }
  }
  return data;
}

function getColor(score: number): string {
  if (score === 0) return 'rgba(255,255,255,0.03)';
  if (score < 1.5) return 'rgba(34,197,94,0.35)';
  if (score < 2.5) return 'rgba(34,197,94,0.6)';
  if (score < 3.5) return 'rgba(250,204,21,0.5)';
  if (score < 4.2) return 'rgba(249,115,22,0.55)';
  return 'rgba(239,68,68,0.65)';
}

function getGlowColor(score: number): string {
  if (score < 1.5) return 'rgba(34,197,94,0.15)';
  if (score < 2.5) return 'rgba(34,197,94,0.2)';
  if (score < 3.5) return 'rgba(250,204,21,0.15)';
  if (score < 4.2) return 'rgba(249,115,22,0.2)';
  return 'rgba(239,68,68,0.25)';
}

const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export const RegretHeatmap: React.FC = () => {
  const [tooltip, setTooltip] = useState<{ data: DayData; x: number; y: number } | null>(null);
  const data = useMemo(() => generateHeatmapData(), []);

  // Group into weeks (columns)
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // Pad the first week
  if (data.length > 0) {
    const firstDate = new Date(data[0].date);
    const firstDay = firstDate.getDay() === 0 ? 6 : firstDate.getDay() - 1; // Mon=0
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: '', score: -1, amount: 0, category: '' });
    }
  }

  data.forEach((d) => {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', score: -1, amount: 0, category: '' });
    }
    weeks.push(currentWeek);
  }

  // Stats
  const validDays = data.filter(d => d.score > 0);
  const avgScore = validDays.length ? (validDays.reduce((s, d) => s + d.score, 0) / validDays.length) : 0;
  const highRegretDays = validDays.filter(d => d.score >= 3.5).length;
  const totalSpent = validDays.reduce((s, d) => s + d.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'white', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px' }}>
            Spending Regret Heatmap
          </h3>
          <span style={{ fontSize: '11px', color: 'rgba(200,210,255,0.45)', fontFamily: 'JetBrains Mono, monospace' }}>
            Last 12 weeks · Daily regret intensity
          </span>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Avg Score', value: avgScore.toFixed(1), color: avgScore < 2.5 ? '#22c55e' : avgScore < 3.5 ? '#f59e0b' : '#ef4444' },
            { label: 'High Regret', value: `${highRegretDays}d`, color: '#ef4444' },
            { label: 'Total Spent', value: `₹${(totalSpent / 1000).toFixed(0)}K`, color: '#6366f1' },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: stat.color }}>{stat.value}</span>
              <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(200,210,255,0.35)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '8px' }}>
        {/* Weekday labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginRight: '4px', flexShrink: 0 }}>
          {WEEKDAYS.map((day, i) => (
            <div key={i} style={{ width: '24px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '4px' }}>
              <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(200,210,255,0.3)' }}>{day}</span>
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map((day, di) => {
              if (day.score < 0) {
                return <div key={di} style={{ width: '14px', height: '14px' }} />;
              }
              return (
                <motion.div
                  key={di}
                  whileHover={{ scale: 1.6, zIndex: 10 }}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setTooltip({ data: day, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    background: getColor(day.score),
                    boxShadow: day.score >= 3.5 ? `0 0 6px ${getGlowColor(day.score)}` : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    border: day.score > 0 ? `1px solid ${getColor(day.score).replace(/[\d.]+\)$/, '0.3)')}` : '1px solid rgba(255,255,255,0.02)',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(200,210,255,0.3)' }}>Low</span>
        {[0.5, 1.5, 2.5, 3.5, 4.5].map(score => (
          <div key={score} style={{ width: '12px', height: '12px', borderRadius: '2px', background: getColor(score) }} />
        ))}
        <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(200,210,255,0.3)' }}>High Regret</span>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && tooltip.data.score > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              left: tooltip.x - 60,
              top: tooltip.y - 80,
              background: 'rgba(10,10,20,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '10px 14px',
              zIndex: 9999,
              backdropFilter: 'blur(12px)',
              pointerEvents: 'none',
              minWidth: '140px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'white', fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
              {new Date(tooltip.data.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(200,210,255,0.5)' }}>Score</span>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: getColor(tooltip.data.score).replace(/[\d.]+\)$/, '1)'), fontWeight: 800 }}>{tooltip.data.score}/5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(200,210,255,0.5)' }}>Spent</span>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#14b8a6', fontWeight: 700 }}>₹{tooltip.data.amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(200,210,255,0.5)' }}>Category</span>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#6366f1', fontWeight: 700 }}>{tooltip.data.category}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
