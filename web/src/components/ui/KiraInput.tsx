import React, { InputHTMLAttributes, useId, useState } from 'react';
import { motion } from 'framer-motion';

export interface KiraInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string;
  prefixContent?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const KiraInput = React.forwardRef<HTMLInputElement, KiraInputProps>(
  ({ label, prefixContent, error, helperText, className = '', value, onChange, onFocus, onBlur, style, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? `kira-input-${generatedId}`;
    const helperId = `${id}-helper`;
    const [isFocused, setIsFocused] = useState(false);
    const isFilled = value !== undefined && value !== '';
    const isActive = isFocused || isFilled;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const borderColor = error ? '#ef4444' : isFocused ? 'var(--purple-500, #a855f7)' : 'var(--border-default, #2a2c3a)';
    const shadowColor = error ? 'rgba(239,68,68,0.2)' : 'rgba(168,85,247,0.2)';

    return (
      <div
        className={`kira-input-wrapper ${className}`}
        style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'Outfit, sans-serif', width: '100%', ...(style as React.CSSProperties) }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-elevated, #1a1b26)',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            boxShadow: isFocused ? `0 0 0 3px ${shadowColor}` : 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            height: '52px',
          }}
        >
          {prefixContent && (
            <div
              style={{
                padding: '0 14px',
                borderRight: `1px solid var(--border-default, #2a2c3a)`,
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexShrink: 0,
              }}
            >
              {prefixContent}
            </div>
          )}

          <div style={{ position: 'relative', flex: 1, height: '100%' }}>
            {/* Floating label — uses animate (not layout) to avoid expensive measure on keystroke */}
            <motion.label
              htmlFor={id}
              animate={{
                y: isActive ? 4 : 15,
                scale: isActive ? 0.72 : 1,
                color: error ? '#ef4444' : isFocused ? '#a855f7' : 'rgba(255,255,255,0.4)',
              }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: '12px',
                top: 0,
                pointerEvents: 'none',
                transformOrigin: 'top left',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </motion.label>

            <input
              ref={ref}
              id={id}
              value={value}
              onChange={onChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-describedby={(error || helperText) ? helperId : undefined}
              aria-invalid={!!error}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '22px 12px 6px 12px',
                color: 'var(--text-primary, #fff)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '15px',
              }}
              {...props}
            />
          </div>
        </div>

        {(error || helperText) && (
          <div
            id={helperId}
            role={error ? 'alert' : undefined}
            style={{
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              color: error ? '#ef4444' : 'rgba(255,255,255,0.4)',
              paddingLeft: '4px',
              lineHeight: 1.4,
            }}
          >
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

KiraInput.displayName = 'KiraInput';
