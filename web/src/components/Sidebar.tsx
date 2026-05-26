import React, { useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { ShieldIcon, BoltIcon, TrendingUpIcon, CpuIcon, UploadCloudIcon, SparklesIcon } from './ui/Icons';
import { useKiraStore, type TabId } from '../store/useKiraStore';

interface NavItem {
  id: TabId;
  label: string;
  Icon: React.FC<{ size?: number; color?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'coach',    label: 'Coach',    Icon: ShieldIcon },
  { id: 'impact',   label: 'Impact',   Icon: BoltIcon },
  { id: 'forecast', label: 'Forecast', Icon: TrendingUpIcon },
  { id: 'explain',  label: 'Explain',  Icon: CpuIcon },
  { id: 'artifacts',label: 'Builder',  Icon: SparklesIcon },
  { id: 'upload',   label: 'Upload',   Icon: UploadCloudIcon },
];

interface SidebarProps {
  onNewSession: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewSession }) => {
  const { activeTab, setActiveTab, coachData, session } = useKiraStore();
  const [hoveredId, setHoveredId] = useState<TabId | null>(null);

  const status     = coachData?.status ?? null;
  const dotColor   = status === 'critical' ? '#ef4444' : status === 'watch' ? '#f59e0b' : '#22c55e';
  const runwayDays = coachData?.runwayDays ?? null;
  const uploadIdDisplay = session?.uploadId
    ? session.uploadId.slice(-8).toUpperCase()
    : '–';

  return (
    <nav
      aria-label="Main navigation"
      style={{
        width: '220px', height: '100%',
        background: 'var(--bg-surface, #0d0f17)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          role="img"
          aria-label="Kira-AI logo"
          style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '18px', color: 'white', flexShrink: 0,
          }}
        >
          K
        </div>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: 'white' }}>
            Kira-AI
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            v1.0.0
          </div>
        </div>
      </div>

      {/* Nav */}
      <LayoutGroup id="sidebar-nav">
        <div
          role="list"
          style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}
        >
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive  = activeTab === id;
            const isHovered = hoveredId === id;
            const iconColor = isActive ? 'white' : isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)';

            return (
              <div key={id} role="listitem">
                <button
                  aria-label={`Navigate to ${label}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(id)}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: 'relative', padding: '10px 16px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: 'pointer', background: 'transparent', border: 'none',
                    width: '100%', textAlign: 'left',
                    color: isActive ? 'white' : isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.15s',
                  }}
                >
                  {/* Shared-element animated active pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      initial={false}
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(168,85,247,0.12)',
                        borderLeft: '2px solid #a855f7',
                        borderRadius: '8px', zIndex: 0,
                      }}
                    />
                  )}
                  {/* Hover tint (not layoutId so it doesn't conflict) */}
                  {!isActive && isHovered && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', borderLeft: '2px solid transparent', borderRadius: '8px', zIndex: 0 }} />
                  )}
                  <span aria-hidden="true" style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
                    <Icon size={18} color={iconColor} />
                  </span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: isActive ? 500 : 400, position: 'relative', zIndex: 1 }}>
                    {label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      {/* Separator */}
      <div aria-hidden="true" style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 20px' }} />

      {/* Bottom status */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div
          role="status"
          aria-label={`Financial status: ${status ?? 'no data loaded'}. ${runwayDays !== null ? `${runwayDays} days remaining.` : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div style={{ position: 'relative', width: '12px', height: '12px', flexShrink: 0 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, position: 'absolute', top: '2px', left: '2px', zIndex: 2 }} />
            <motion.div
              animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: '2px', left: '2px', width: '8px', height: '8px', borderRadius: '50%', background: dotColor, zIndex: 1 }}
            />
          </div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
              Days: {runwayDays !== null ? runwayDays : '—'}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
              ID: {uploadIdDisplay}
            </div>
          </div>
        </div>

        <button
          onClick={onNewSession}
          aria-label="Start a new Kira-AI session"
          style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget).style.background = 'rgba(255,255,255,0.07)';
            (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.14)';
          }}
          onMouseLeave={e => {
            (e.currentTarget).style.background = 'rgba(255,255,255,0.03)';
            (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          ↩ New session
        </button>
      </div>
    </nav>
  );
};
