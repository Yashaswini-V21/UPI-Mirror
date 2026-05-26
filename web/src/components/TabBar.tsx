import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { ShieldIcon, BoltIcon, TrendingUpIcon, CpuIcon, UploadCloudIcon } from './ui/Icons';
import { useKiraStore, type TabId } from '../store/useKiraStore';

const TABS: { id: TabId; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { id: 'coach',    label: 'Coach',    Icon: ShieldIcon },
  { id: 'impact',   label: 'Impact',   Icon: BoltIcon },
  { id: 'forecast', label: 'Forecast', Icon: TrendingUpIcon },
  { id: 'explain',  label: 'Explain',  Icon: CpuIcon },
  { id: 'upload',   label: 'Upload',   Icon: UploadCloudIcon },
];

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useKiraStore();

  return (
    <nav
      aria-label="Mobile tab navigation"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px',
        background: 'rgba(13, 15, 23, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '0 4px', zIndex: 50,
      }}
    >
      <LayoutGroup id="tabbar-nav">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const color = isActive ? 'white' : 'rgba(255,255,255,0.4)';
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', flex: 1, height: '100%', cursor: 'pointer',
                gap: '3px', background: 'transparent', border: 'none', color,
                transition: 'color 0.2s', minWidth: 0,
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: '#a855f7', borderRadius: '0 0 2px 2px' }}
                />
              )}
              <span aria-hidden="true" style={{ display: 'flex' }}>
                <Icon size={20} color={color} />
              </span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', fontWeight: isActive ? 500 : 400, lineHeight: 1 }}>
                {label}
              </span>
            </button>
          );
        })}
      </LayoutGroup>
    </nav>
  );
};
