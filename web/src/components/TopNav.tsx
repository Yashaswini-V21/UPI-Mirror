import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from './ui';
import { BellIcon, MenuIcon } from './ui/Icons';
import { useKiraStore } from '../store/useKiraStore';

interface TopNavProps {
  onMenuOpen?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuOpen }) => {
  const { activeTab, coachData, hasAlert, exitDashboard } = useKiraStore();
  const [bellOpen, setBellOpen] = useState(false);
  const showDot = hasAlert;

  const tabLabels: Record<string, string> = {
    coach: 'Coach',
    impact: 'Impact',
    forecast: 'Forecast',
    explain: 'Explain ML',
    upload: 'Upload',
    artifacts: 'Artifacts Builder',
  };

  return (
    <header
      style={{ height: '56px', width: '100%', background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10, flexShrink: 0 }}
    >
      {/* Left: breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile hamburger — now functional */}
        <button
          className="mobile-only"
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '4px' }}
        >
          <MenuIcon size={22} color="currentColor" />
        </button>
        <nav aria-label="Breadcrumb">
          <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, padding: 0, listStyle: 'none' }}>
            <li
              onClick={exitDashboard}
              style={{
                fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', transition: 'color 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
              title="Go back to Landing Page"
            >
              Kira-AI
            </li>
            <li aria-hidden="true" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>/</li>
            <li style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'white', fontWeight: 500 }} aria-current="page">{tabLabels[activeTab] ?? activeTab}</li>
          </ol>
        </nav>
      </div>

      {/* Right: status + bell */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {coachData && <StatusBadge status={coachData.status} size="sm" />}

        {/* Bell with alert dot */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setBellOpen(o => !o)}
            aria-label={showDot ? 'View notifications (1 new)' : 'Notifications'}
            aria-expanded={bellOpen}
            aria-haspopup="dialog"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', padding: '4px', borderRadius: '6px', transition: 'color 0.2s' }}
          >
            <BellIcon size={20} color="currentColor" />
            {showDot && (
              <span
                aria-hidden="true"
                style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg-base, #03040a)' }}
              />
            )}
          </button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                role="dialog"
                aria-label="Notifications"
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  background: 'rgba(13,15,23,0.96)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                  padding: '12px 16px', minWidth: '240px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {showDot ? (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', marginBottom: '6px' }}>GitLab Alert</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Critical spending issue logged. Check the Coach tab.</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px 0' }}>No new notifications</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
