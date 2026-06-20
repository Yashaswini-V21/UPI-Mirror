/**
 * landing/primitives/DecryptedText.tsx
 * ──────────────────────────────────────
 * Animated decryption effect for hero text.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 25,
  delay = 0,
  className = '',
}) => {
  const [display, setDisplay] = useState('');
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$₹%#@!*&';
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        setDisplay(
          text.split('').map((c, idx) => {
            if (c === ' ') return ' ';
            if (idx < i) return text[idx];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );
        if (i >= text.length) { clearInterval(iv); setDisplay(text); }
        i++;
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [inView, text, speed, delay]);

  return <span ref={ref} className={className}>{display || text}</span>;
};
