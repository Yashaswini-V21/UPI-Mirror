import { useEffect, useState } from 'react';

/**
 * Animates a number from 0 to endValue over duration seconds.
 * Extracted from CoachTab/ForecastTab/ImpactTab to a single shared hook.
 */
export function useCountUp(endValue: number, duration: number = 1.2): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(0);
    if (endValue === 0) return;
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * endValue));
      if (progress < 1) window.requestAnimationFrame(step);
      else setValue(endValue);
    };

    const rafId = window.requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [endValue, duration]);

  return value;
}
