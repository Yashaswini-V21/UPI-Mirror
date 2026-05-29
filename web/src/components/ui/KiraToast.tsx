import React from 'react';
import { Toast, resolveValue } from 'react-hot-toast';
import { CheckIcon, XIcon, InfoIcon, WarningIcon } from './Icons';

export interface KiraToastProps {
  toast: Toast;
}

export const KiraToast: React.FC<KiraToastProps> = ({ toast }) => {
  const type = toast.type as string;

  const config: Record<string, { color: string; Icon: React.FC<{ size: number; color: string }> }> = {
    success: { color: '#22c55e', Icon: (p) => <CheckIcon {...p} /> },
    error:   { color: '#ef4444', Icon: (p) => <XIcon {...p} /> },
    loading: { color: '#a855f7', Icon: (p) => <InfoIcon {...p} /> },
  };

  const { color, Icon } = config[type] ?? { color: '#f59e0b', Icon: (p: any) => <WarningIcon {...p} /> };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        background: 'rgba(13, 15, 23, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `4px solid ${color}`,
        borderRadius: '10px',
        padding: '12px 16px',
        color: 'var(--text-primary, #fff)',
        fontFamily: 'Outfit, sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '420px',
        pointerEvents: 'auto',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-hidden="true">
        <Icon size={18} color={color} />
      </span>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 450, lineHeight: 1.4 }}>
        {resolveValue(toast.message, toast)}
      </span>
    </div>
  );
};
