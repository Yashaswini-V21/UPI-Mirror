/**
 * landing/Starfield.tsx
 * ──────────────────────
 * Canvas-based interactive starfield with mouse repulsion.
 */
import React, { useEffect, useRef } from 'react';

const STAR_COUNT = 180;
const STAR_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#818cf8'];
const CONNECT_DIST_SQ = 9000;

export const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let animId: number;

    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.5 + 0.15,
      c: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));

    let mx = -1000, my = -1000;
    const onMouse = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMouse);

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        const dx = mx - s.x, dy = my - s.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160) {
          s.x -= (dx / d) * ((160 - d) / 160) * 0.5;
          s.y -= (dy / d) * ((160 - d) / 160) * 0.5;
        }
        s.x = (s.x + s.vx + w) % w;
        s.y = (s.y + s.vy + h) % h;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.c;
        ctx.globalAlpha = s.a;
        ctx.shadowColor = s.c;
        ctx.shadowBlur = s.r > 1 ? 5 : 0;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONNECT_DIST_SQ) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.07 - (d2 / CONNECT_DIST_SQ) * 0.07})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
};
