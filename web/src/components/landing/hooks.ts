/**
 * landing/hooks.ts
 * ─────────────────
 * Shared hooks extracted from the monolith LandingScreen.tsx.
 */
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

// ─── Count-Up ────────────────────────────────────────────────────────────────
export const useCountUp = (end: number, duration = 1.8, decimals = 0) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const ease = p * (2 - p);
      setVal(Number((end * ease).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(end);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration, decimals]);

  return { val, ref };
};
