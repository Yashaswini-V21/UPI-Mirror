import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  Menu, X, Shield, Check, Activity, Sparkles, ArrowRight, Lock,
  TrendingUp, Smartphone, MessageSquare, Database, Zap, Settings,
  AlertCircle, Calendar, DollarSign, ChevronRight, Star, Globe,
  Terminal, Cpu, Server, Wifi, Eye, BarChart3
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  indigo: '#6366f1',
  pink: '#ec4899',
  teal: '#14b8a6',
  bg: '#03030c',
  surface: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)',
  borderGlow: 'rgba(99,102,241,0.25)',
  textPrimary: '#f0f4ff',
  textMuted: 'rgba(200,210,255,0.55)',
  textFaint: 'rgba(200,210,255,0.28)',
  grad: 'linear-gradient(135deg,#6366f1,#ec4899,#14b8a6)',
  gradH: 'linear-gradient(90deg,#6366f1,#ec4899)',
  gradV: 'linear-gradient(180deg,#6366f1,#14b8a6)',
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: WORD REVEAL
// ─────────────────────────────────────────────────────────────────────────────
interface WordRevealProps { text: string; className?: string; style?: React.CSSProperties; delay?: number; }
const WordReveal: React.FC<WordRevealProps> = ({ text, className = '', style = {}, delay = 0 }) => {
  const words = text.split(' ');
  return (
    <span className={className} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', ...style }}>
      {words.map((word, idx) => (
        <span key={idx} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.22em' }}>
          <motion.span
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: delay + idx * 0.06 }}
            style={{ display: 'inline-block' }}
          >{word}</motion.span>
        </span>
      ))}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: COUNT-UP HOOK
// ─────────────────────────────────────────────────────────────────────────────
const useCountUp = (end: number, duration = 1.8, decimals = 0) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: DECRYPTED TEXT
// ─────────────────────────────────────────────────────────────────────────────
interface DecryptedTextProps { text: string; speed?: number; delay?: number; className?: string; }
const DecryptedText: React.FC<DecryptedTextProps> = ({ text, speed = 25, delay = 0, className = '' }) => {
  const [display, setDisplay] = useState('');
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$₹%#@!*&';
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        setDisplay(text.split('').map((c, idx) => {
          if (c === ' ') return ' ';
          if (idx < i) return text[idx];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join(''));
        if (i >= text.length) { clearInterval(iv); setDisplay(text); }
        i++;
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [inView, text, speed, delay]);
  return <span ref={ref} className={className}>{display || text}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: MAGNETIC BUTTON
// ─────────────────────────────────────────────────────────────────────────────
interface MagneticButtonProps { onClick?: () => void; className?: string; style?: React.CSSProperties; children: React.ReactNode; 'aria-label'?: string; }
const MagneticButton: React.FC<MagneticButtonProps> = ({ children, style = {}, onClick, className = '', 'aria-label': label }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.35 }); }} onMouseLeave={() => setPos({ x: 0, y: 0 })} style={{ display: 'inline-block' }}>
      <motion.button onClick={onClick} aria-label={label} className={className} animate={{ x: pos.x, y: pos.y }} transition={{ type: 'spring', stiffness: 220, damping: 20 }} style={{ position: 'relative', cursor: 'pointer', border: 'none', outline: 'none', background: 'none', ...style }}>{children}</motion.button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: SPOTLIGHT CARD
// ─────────────────────────────────────────────────────────────────────────────
interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> { children: React.ReactNode; glowColor?: string; }
const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, glowColor = 'rgba(99,102,241,0.15)', className = '', style = {}, ...props }) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hov, setHov] = useState(false);
  return (
    <div onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setCoords({ x: e.clientX - r.left, y: e.clientY - r.top }); }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} className={`spotlight-card ${className}`} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)', ...style }} {...props}>
      {hov && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 65%)`, pointerEvents: 'none', zIndex: 1, borderRadius: 'inherit' }} />}
      <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>{children}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS STARFIELD
// ─────────────────────────────────────────────────────────────────────────────
const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let animId: number;
    const stars = Array.from({ length: 180 }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 1.5 + 0.3, a: Math.random() * 0.5 + 0.15, c: ['#6366f1', '#ec4899', '#14b8a6', '#818cf8'][Math.floor(Math.random() * 4)] }));
    let mx = -1000, my = -1000;
    const onMouse = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMouse);
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(s => {
        const dx = mx - s.x, dy = my - s.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160) { s.x -= dx / d * (160 - d) / 160 * 0.5; s.y -= dy / d * (160 - d) / 160 * 0.5; }
        s.x = (s.x + s.vx + w) % w; s.y = (s.y + s.vy + h) % h;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.c; ctx.globalAlpha = s.a; ctx.shadowColor = s.c; ctx.shadowBlur = s.r > 1 ? 5 : 0; ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      });
      for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) {
        const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { ctx.beginPath(); ctx.strokeStyle = `rgba(99,102,241,${0.07 - d2 / 9000 * 0.07})`; ctx.lineWidth = 0.5; ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(stars[j].x, stars[j].y); ctx.stroke(); }
      }
      animId = requestAnimationFrame(render);
    };
    render();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND EFFECTS
// ─────────────────────────────────────────────────────────────────────────────
const BackgroundEffects = ({ scrollYProgress }: { scrollYProgress: any }) => {
  const gridY = useTransform(scrollYProgress, [0, 0.5], [0, 35]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', backgroundColor: C.bg }}>
      <Starfield />
      <motion.div style={{ position: 'absolute', width: '300%', height: '300%', top: '-100%', left: '-100%', backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.03) 1px, transparent 1px)`, backgroundSize: '72px 72px', transform: 'perspective(500px) rotateX(68deg)', y: gridY, maskImage: 'radial-gradient(circle at center, black 18%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle at center, black 18%, transparent 70%)' }} />
      <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '45vw', height: '45vw', background: 'radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)', filter: 'blur(90px)', animation: 'kira-drift 28s infinite alternate ease-in-out' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle,rgba(236,72,153,0.09),transparent 70%)', filter: 'blur(90px)', animation: 'kira-drift 24s infinite alternate-reverse ease-in-out' }} />
      <div style={{ position: 'absolute', top: '40%', left: '20%', width: '35vw', height: '35vw', background: 'radial-gradient(circle,rgba(20,184,166,0.07),transparent 70%)', filter: 'blur(100px)', animation: 'kira-drift 32s infinite alternate ease-in-out' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15, mixBlendMode: 'overlay' }}><filter id="nz"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#nz)" /></svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── FLOATING CAPSULE NAVBAR ──
// ─────────────────────────────────────────────────────────────────────────────
const NavWithStart = ({ onStart }: { onStart?: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => {
    const sections = ['features', 'simulator', 'howitworks', 'security', 'pricing'];
    const obs = new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  const navItems = ['Features', 'Simulator', 'How it Works', 'Security', 'Pricing'];
  return (
    <>
      <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'fixed', top: '18px', left: '20px', right: '20px', zIndex: 9999, display: 'flex', justifyContent: 'center' }}>
        <nav style={{ width: '100%', maxWidth: scrolled ? '800px' : '1060px', background: 'rgba(3,3,12,0.75)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: scrolled ? `1px solid ${C.borderGlow}` : `1px solid ${C.border}`, borderRadius: '99px', padding: scrolled ? '10px 22px' : '13px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: scrolled ? '0 14px 44px rgba(0,0,0,0.7),0 0 24px rgba(99,102,241,0.14)' : '0 8px 32px rgba(0,0,0,0.35)', transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
          {/* Logo */}
          <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.7 }} style={{ width: '30px', height: '30px', borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', color: 'white', boxShadow: `0 0 14px rgba(99,102,241,0.6)` }}>K</motion.div>
            <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(90deg,#f0f4ff,rgba(200,210,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Kira-AI</span>
          </div>
          {/* Nav links */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
            {navItems.map((item) => {
              const id = item.toLowerCase().replace(/\s+/g, '');
              const isActive = (hovered || active) === id;
              return (
                <a key={item} href={`#${id}`} onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: isActive ? 'white' : 'rgba(200,210,255,0.6)', textDecoration: 'none', fontSize: '13px', fontWeight: 600, padding: '7px 15px', borderRadius: '99px', position: 'relative', transition: 'color 0.25s', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {isActive && <motion.span layoutId="nav-pill" style={{ position: 'absolute', inset: 0, borderRadius: '99px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)' }} transition={{ type: 'spring', stiffness: 360, damping: 30 }} />}
                  {active === id && <motion.span style={{ width: '4px', height: '4px', borderRadius: '50%', background: C.indigo, boxShadow: `0 0 6px ${C.indigo}`, flexShrink: 0 }} layoutId="nav-dot" />}
                  <span style={{ position: 'relative' }}>{item}</span>
                </a>
              );
            })}
          </div>
          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="desktop-only" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: `${C.teal}cc`, letterSpacing: '0.06em' }}>v3.0.0</span>
            <motion.button onClick={onStart} aria-label="Launch App" whileHover={{ scale: 1.06, boxShadow: '0 6px 22px rgba(99,102,241,0.45)' }} whileTap={{ scale: 0.95 }} style={{ borderRadius: '99px', padding: '8px 20px', fontSize: '13px', background: C.grad, border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>Launch App</motion.button>
            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" className="mobile-hamburger-btn" style={{ background: C.surface, border: `1px solid ${C.border}`, color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>{mobileOpen ? <X size={17} /> : <Menu size={17} />}</button>
          </div>
        </nav>
      </motion.div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} style={{ position: 'fixed', top: '88px', left: '20px', right: '20px', background: 'rgba(6,6,18,0.97)', backdropFilter: 'blur(28px)', border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 9998, boxShadow: '0 24px 60px rgba(0,0,0,0.85)' }}>
            {navItems.map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '')}`} onClick={(e) => { e.preventDefault(); setMobileOpen(false); document.getElementById(item.toLowerCase().replace(/\s+/g, ''))?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: 'rgba(200,210,255,0.85)', textDecoration: 'none', fontSize: '15px', fontWeight: 600, padding: '10px 0', borderBottom: `1px solid ${C.border}`, fontFamily: 'Outfit, sans-serif' }}>{item}</a>
            ))}
            <button onClick={() => { setMobileOpen(false); onStart?.(); }} style={{ background: C.grad, color: 'white', border: 'none', padding: '14px', borderRadius: '99px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '8px', fontFamily: 'Outfit, sans-serif' }}>Launch Dashboard</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── HERO SECTION – ASYMMETRIC LAYOUT WITH FLOATING CHIPS & RADAR RINGS ──
// ─────────────────────────────────────────────────────────────────────────────
const FloatingChip = ({ label, amount, color, x, y, delay }: { label: string; amount: string; color: string; x: string; y: string; delay: number; }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
    transition={{ opacity: { delay, duration: 0.5 }, scale: { delay, duration: 0.5 }, y: { delay: delay + 0.5, duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' } }}
    style={{ position: 'absolute', left: x, top: y, background: 'rgba(6,6,18,0.85)', backdropFilter: 'blur(20px)', border: `1px solid ${color}44`, borderRadius: '14px', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${color}22`, zIndex: 5 }}
  >
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: color, fontWeight: 700, letterSpacing: '0.06em' }}>{label}</span>
    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: 'white', fontWeight: 800 }}>{amount}</span>
  </motion.div>
);

const RadarRings = () => {
  const rings = [90, 70, 50, 30];
  return (
    <div style={{ position: 'relative', width: '380px', height: '380px', flexShrink: 0 }}>
      {/* Radar rings */}
      {rings.map((r, i) => (
        <motion.div key={i} animate={{ rotate: i % 2 === 0 ? 360 : -360 }} transition={{ duration: 12 + i * 4, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: `${(100 - r) / 2 * 3.8}px`, border: `1px solid rgba(99,102,241,${0.12 - i * 0.02})`, borderRadius: '50%', borderTopColor: i === 0 ? C.indigo : i === 1 ? C.pink : C.teal, boxShadow: i < 2 ? `0 0 12px rgba(99,102,241,0.1)` : 'none' }} />
      ))}
      {/* Center pulse */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} style={{ width: '72px', height: '72px', borderRadius: '50%', background: `radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)`, border: `2px solid ${C.indigo}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px rgba(99,102,241,0.4)` }}>
          <span style={{ fontWeight: 900, fontSize: '18px', color: 'white', fontFamily: 'Outfit, sans-serif' }}>K</span>
        </motion.div>
      </div>
      {/* Scan line */}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '50%', height: '2px', transformOrigin: 'left center', background: `linear-gradient(90deg, ${C.indigo}88, transparent)`, boxShadow: `0 0 8px ${C.indigo}` }} />
      </motion.div>
      {/* Dot nodes on rings */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} style={{ position: 'absolute', top: '50%', left: '50%', width: '8px', height: '8px', borderRadius: '50%', background: [C.indigo, C.pink, C.teal, C.indigo, C.pink][i], transform: `rotate(${deg}deg) translateX(120px) translate(-50%,-50%)`, boxShadow: `0 0 8px ${[C.indigo, C.pink, C.teal, C.indigo, C.pink][i]}` }} />
      ))}
    </div>
  );
};

const HeroWithStart = ({ onStart }: { onStart?: () => void }) => {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '100px', position: 'relative', zIndex: 1, padding: '120px 24px 80px', overflow: 'hidden' }}>
      {/* Background accent orb */}
      <div style={{ position: 'absolute', right: '0', top: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', maxWidth: '1200px', margin: '0 auto', alignItems: 'center', gap: '80px', flexWrap: 'wrap' }}>
        {/* LEFT: Text content */}
        <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '99px', border: `1px solid rgba(99,102,241,0.35)`, background: 'rgba(99,102,241,0.07)', marginBottom: '28px' }}>
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: 'rgba(200,210,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <DecryptedText text="Cognitive Runway Forecast Engine" speed={22} />
            </span>
          </motion.div>

          {/* Heading */}
          <h1 style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5rem)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-2.5px', margin: '0 0 24px 0', fontFamily: 'Outfit, sans-serif' }}>
            <span style={{ display: 'block', color: C.textPrimary }}><WordReveal text="Know Your" delay={0.05} /></span>
            <span style={{ display: 'block', fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 400, background: `linear-gradient(90deg, ${C.indigo}, ${C.pink}, ${C.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-1px' }}>
              <WordReveal text="Money Runway" delay={0.3} />
            </span>
            <span style={{ display: 'block', color: C.textMuted, fontSize: '0.78em', fontWeight: 500, letterSpacing: '-1px' }}>
              <WordReveal text="Before It Runs Out." delay={0.55} />
            </span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }} style={{ fontSize: '1.05rem', color: C.textMuted, lineHeight: 1.7, maxWidth: '480px', margin: '0 0 36px 0', fontFamily: 'Outfit, sans-serif' }}>
            Kira ingests your transaction statements, identifies cognitive spending loops, and dispatches behavioral WhatsApp alerts before your balance hits crisis level.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.85 }} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <MagneticButton onClick={onStart} aria-label="Launch Dashboard">
              <div style={{ padding: '15px 34px', fontSize: '14.5px', background: C.grad, borderRadius: '99px', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 28px rgba(99,102,241,0.45)', fontFamily: 'Outfit, sans-serif' }}>
                Launch Dashboard <ChevronRight size={16} />
              </div>
            </MagneticButton>
            <MagneticButton onClick={() => document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Try Simulator">
              <div style={{ padding: '15px 34px', fontSize: '14.5px', border: `1px solid rgba(255,255,255,0.14)`, borderRadius: '99px', color: 'white', fontWeight: 600, background: 'rgba(255,255,255,0.03)', fontFamily: 'Outfit, sans-serif' }}>
                Try Simulator
              </div>
            </MagneticButton>
          </motion.div>

          {/* Trust line */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '40px', flexWrap: 'wrap' }}>
            {[{ label: '800M+', sub: 'nodes traversed' }, { label: '93/100', sub: 'tests passed' }, { label: '₹0', sub: 'hosting cost' }].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 900, color: 'white' }}>{s.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9.5px', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.sub}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT: Radar + Floating chips */}
        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} style={{ flex: '1 1 380px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '400px' }}>
          <RadarRings />
          <FloatingChip label="UPI DEDUCTED" amount="₹1,420" color={C.pink} x="0px" y="40px" delay={0.9} />
          <FloatingChip label="RUNWAY LEFT" amount="18 Days" color={C.teal} x="260px" y="20px" delay={1.1} />
          <FloatingChip label="MERCH LOOP" amount="SWIGGY ⚠" color="#f59e0b" x="290px" y="280px" delay={1.3} />
          <FloatingChip label="ALERT SENT" amount="WhatsApp ✓" color="#22c55e" x="-30px" y="300px" delay={1.5} />
        </motion.div>
      </div>

      <style>{`
        @media(max-width:900px){
          section .hero-row { flex-direction:column!important; gap:60px!important; }
        }
      `}</style>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── STATS STRIP – CIRCULAR GAUGE RINGS ──
// ─────────────────────────────────────────────────────────────────────────────
const GaugeStat = ({ num, suffix, prefix, label, color, decimals = 0, pct }: { num: number; suffix?: string; prefix?: string; label: string; color: string; decimals?: number; pct: number; }) => {
  const { val, ref } = useCountUp(num, 2, decimals);
  const r = 42; const circ = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  useEffect(() => { if (inView) setTimeout(() => setProgress(pct), 200); }, [inView, pct]);
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '0 16px' }}>
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - (progress / 100) * circ }} transition={{ duration: 1.8, ease: 'easeOut' }} style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{prefix}{val}{suffix}</span>
        </div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9.5px', color: C.textFaint, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', maxWidth: '110px' }}>{label}</span>
    </div>
  );
};

const StatsStrip = () => {
  const stats = [
    { num: 800, suffix: 'M+', label: 'Agent Nodes Traversed', color: C.indigo, pct: 88 },
    { num: 93, suffix: '%', label: 'Unit Tests Passing', color: '#22c55e', pct: 93 },
    { num: 9.4, suffix: '/10', label: 'User Rating Score', color: C.teal, decimals: 1, pct: 94 },
    { num: 0, prefix: '₹', label: 'Permanent Hosting Cost', color: C.pink, pct: 100 },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <SpotlightCard glowColor="rgba(99,102,241,0.08)" style={{ background: 'rgba(6,6,18,0.55)', border: `1px solid ${C.border}`, backdropFilter: 'blur(20px)', padding: '48px 32px' }}>
        <div className="stats-grid" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
          {stats.map((s, i) => (
            <React.Fragment key={i}>
              <GaugeStat {...s} />
              {i < stats.length - 1 && <div className="stats-divider" style={{ width: '1px', height: '80px', background: `linear-gradient(to bottom, transparent, ${C.border}, transparent)` }} />}
            </React.Fragment>
          ))}
        </div>
      </SpotlightCard>
      <style>{`
        @media(max-width:768px){
          .stats-grid { flex-direction:column!important; }
          .stats-divider { width:60%!important; height:1px!important; background:linear-gradient(to right,transparent,rgba(255,255,255,0.07),transparent)!important; }
        }
      `}</style>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── NUDGE SIMULATOR & PHONE LOCK SEQUENCE (PRESERVED EXACTLY) ──
// ─────────────────────────────────────────────────────────────────────────────
const NudgePlayground = () => {
  const [activePersona, setActivePersona] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [typedNudge, setTypedNudge] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [phoneState, setPhoneState] = useState<'off' | 'lockscreen' | 'homescreen'>('off');

  const personas = [
    {
      id: 0,
      title: "Tech Professional",
      avatar: "💻",
      description: "Discretionary leakage on delivery apps, daily micro-transit & cloud services.",
      transactions: [
        "UPI: ₹1,420 to Swiggy - APPROVED",
        "UPI: ₹350 to Uber Auto - APPROVED",
        "UPI: ₹840 to Starbucks - APPROVED",
        "UPI: ₹4,990 to Amazon Prime - APPROVED",
        "UPI: ₹1,180 to Zomato - APPROVED"
      ],
      nudge: "Kira Nudge: Food delivery & transit have eaten 45% of your discretionary cap. Cash forecast indicates zero balance by Oct 14th (12 days early). Action: Freeze Swiggy orders for 3 days to recover ₹2,420."
    },
    {
      id: 1,
      title: "College Student",
      avatar: "🎓",
      description: "Tight allowance parameters, high weekend dining out, movie bookings.",
      transactions: [
        "UPI: ₹220 to Chai Point - APPROVED",
        "UPI: ₹480 to PVR Cinemas - APPROVED",
        "UPI: ₹120 to Auto Fare - APPROVED",
        "UPI: ₹190 to McDonald's - APPROVED",
        "UPI: ₹299 to Spotify - APPROVED"
      ],
      nudge: "Kira Nudge: Daily cafes and movie tickets have consumed 82% of your monthly money with 12 days remaining. Zero-date: June 1st. Action: Switch cafes to campus libraries and save ₹1,150."
    },
    {
      id: 2,
      title: "Freelance Designer",
      avatar: "🎨",
      description: "Irregular retainer payouts, co-working rents, software license charges.",
      transactions: [
        "UPI: ₹7,500 from Client B - DEPOSITED",
        "UPI: ₹2,200 to Adobe Suite - APPROVED",
        "UPI: ₹4,500 to WeWork Spaces - APPROVED",
        "UPI: ₹380 to Cafe CCD - APPROVED",
        "UPI: ₹950 to Zomato - APPROVED"
      ],
      nudge: "Kira Nudge: Software licenses and co-working rentals exceed this week's deposit inflows. Cash runway is currently 14 days. Action: Defer non-critical software upgrades until next retainer cleared."
    }
  ];

  const runSimulation = (idx: number) => {
    if (simulating) return;
    setSimulating(true);
    setActivePersona(idx);
    setLogs([]);
    setActiveStep(null);
    setTypedNudge('');
    setPhoneState('lockscreen');

    const persona = personas[idx];
    const steps = [
      { msg: "[ParserNode] Ingested raw bank statement table keys.", active: 0 },
      { msg: "[ClassifierNode] Discretionary spending anomalies flagged.", active: 1 },
      { msg: "[RegressorNode] Calculated daily runway burn trajectory.", active: 2 },
      { msg: "[SupervisorNode] Routing audit check for tone compliance...", active: 3 }
    ];

    let currentStep = 0;
    const processStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setLogs(prev => [...prev, step.msg]);
        setActiveStep(step.active);
        currentStep++;
        setTimeout(processStep, 1000);
      } else {
        setSimulating(false);
        setPhoneState('homescreen');
        let charIndex = 0;
        const nudgeText = persona.nudge;
        const typeChar = () => {
          if (charIndex < nudgeText.length) {
            setTypedNudge(prev => prev + nudgeText.charAt(charIndex));
            charIndex++;
            setTimeout(typeChar, 14);
          }
        };
        typeChar();
      }
    };

    setLogs(["[ParserNode] Booting local sandbox agent pipeline..."]);
    setTimeout(processStep, 700);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      id="simulator"
      style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}
    >
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', width: '100%', marginBottom: '100px' }} />

      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '2px', border: '1px solid rgba(168, 85, 247, 0.35)', padding: '4px 14px', borderRadius: '99px', background: 'rgba(168, 85, 247, 0.08)', display: 'inline-block', marginBottom: '16px' }}>
          Interactive Agent Sandbox
        </div>
        <h2 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
          Live <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', background: 'linear-gradient(90deg, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>coaching simulator.</span>
        </h2>
        <p style={{ color: 'rgba(244,247,255,0.6)', fontSize: '17px', maxWidth: '580px', margin: '0 auto' }}>
          Pick a financial profile below to simulate the multi-agent cognitive loops and watch the WhatsApp message pop.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'stretch' }}>
        {/* Left selector cards */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          {personas.map((p, idx) => {
            const isActive = activePersona === idx;
            return (
              <motion.div
                key={p.id}
                onClick={() => runSimulation(idx)}
                whileHover={{ y: -2 }}
                style={{
                  background: isActive ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: isActive ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  boxShadow: isActive ? '0 12px 30px rgba(168, 85, 247, 0.15)' : 'none'
                }}
              >
                <div style={{ fontSize: '32px', width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'white', fontFamily: 'Outfit, sans-serif' }}>{p.title}</h3>
                  <p style={{ color: 'rgba(244,247,255,0.5)', fontSize: '13.5px', margin: 0, lineHeight: 1.45 }}>{p.description}</p>
                </div>
                <ArrowRight size={18} color={isActive ? '#c084fc' : 'rgba(255,255,255,0.2)'} />
              </motion.div>
            );
          })}
        </div>

        {/* Middle/Right: Unified Simulator Workspace IDE */}
        <div style={{ flex: 1.6, minWidth: '320px', display: 'flex', flexDirection: 'column' }}>
          <SpotlightCard
            glowColor="rgba(168, 85, 247, 0.12)"
            style={{
              background: 'rgba(5, 6, 12, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '480px'
            }}
          >
            {/* Header: IDE window controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(2, 2, 6, 0.6)' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                kira-simulator-workspace - v3.0.0
              </div>
              <div style={{ width: '42px' }} />
            </div>

            {/* Split Workspace */}
            <div className="workspace-split" style={{ display: 'flex', flexDirection: 'row', flex: 1, height: 'calc(100% - 40px)' }}>
              {/* Left Column: Terminal console logs */}
              <div style={{ flex: 1.2, padding: '24px', borderRight: '1px solid rgba(255,255,255,0.06)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', background: 'rgba(0, 0, 0, 0.15)', justifyContent: 'space-between', minHeight: '340px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    <span>PIPELINE_AGENT_STREAM</span>
                    <span style={{ color: activePersona !== null ? '#22c55e' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={activePersona !== null ? "animate-pulse" : ""} style={{ width: '6px', height: '6px', borderRadius: '50%', background: activePersona !== null ? '#22c55e' : 'rgba(255,255,255,0.3)' }} />
                      {activePersona !== null ? (simulating ? 'PARSING' : 'CONNECTED') : 'STANDBY'}
                    </span>
                  </div>

                  {activePersona === null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', gap: '12px', padding: '40px 0' }}>
                      <Activity size={28} color="rgba(255,255,255,0.15)" />
                      <span>Select a profile card on the left to fire up the multi-agent nodes.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingested Statements</div>
                        {personas[activePersona].transactions.map((tx, idx) => (
                          <div key={idx} style={{ color: '#10b981', fontSize: '11.5px', opacity: 0.9 }}>&gt; {tx}</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '6px 0' }}>
                        {['Parser', 'Classifier', 'Regressor', 'Supervisor'].map((step, idx) => {
                          const isPassed = activeStep !== null && activeStep >= idx;
                          const isCurrent = activeStep === idx;
                          return (
                            <div key={step} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: isCurrent ? 'rgba(168, 85, 247, 0.15)' : (isPassed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)'), border: isCurrent ? '1px solid #a855f7' : (isPassed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.05)'), color: isCurrent ? '#c084fc' : (isPassed ? '#4ade80' : 'rgba(255,255,255,0.45)'), transition: 'all 0.3s' }}>{step}</div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {activePersona !== null && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '12px' }}>
                    {logs.map((log, idx) => (
                      <div key={idx} style={{ color: log.includes('[SupervisorNode]') ? '#a855f7' : 'rgba(255,255,255,0.6)', fontSize: '11.5px' }}>{log}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Bezel-less phone mock screen */}
              <div style={{ flex: 1, background: 'rgba(2, 2, 6, 0.4)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
                <div style={{ width: '210px', height: '380px', borderRadius: '32px', border: '8px solid #27272a', background: '#03040a', overflow: 'hidden', position: 'relative', boxShadow: '0 15px 35px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }}>
                  {/* Dynamic Island Notch */}
                  <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', width: '50px', height: '11px', background: '#000', borderRadius: '99px', zIndex: 10, border: '1px solid rgba(255,255,255,0.08)' }} />

                  {phoneState === 'off' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', gap: '8px', padding: '20px' }}>
                      <span style={{ fontSize: '24px' }}>📴</span>
                      <span>Sandboxed Screen Standby</span>
                    </div>
                  )}

                  {phoneState === 'lockscreen' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(168,85,247,0.18), transparent 75%)', padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', marginTop: '6px', padding: '0 4px' }}>
                        <span>5G</span>
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}><span>📶</span><span>🔋 88%</span></div>
                      </div>
                      <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif' }}>17:28</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'JetBrains Mono, monospace' }}>Tuesday, May 26</div>
                      </div>
                      <motion.div initial={{ scale: 0.88, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '16px', padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 2px 8px rgba(37,211,102,0.3)', flexShrink: 0 }}>💬</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ margin: 0, color: 'white', fontSize: '9.5px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Kira Budget Coach</h5>
                            <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>now</span>
                          </div>
                          <p style={{ margin: '1px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '8px', fontFamily: 'Outfit, sans-serif', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>Critical Money Runway warning...</p>
                        </div>
                      </motion.div>
                      <div style={{ textAlign: 'center', fontSize: '7.5px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>🔒 Slide to unlock</div>
                    </motion.div>
                  )}

                  {phoneState === 'homescreen' && (
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 180 }} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0b141a' }}>
                      <div style={{ background: '#128c7e', padding: '16px 12px 8px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                        <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '3px', borderRadius: '50%' }}>🤖</span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ color: 'white', margin: 0, fontSize: '10px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Kira Budget Coach</h4>
                          <span style={{ color: '#5bfb8a', fontSize: '7px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>online</span>
                        </div>
                      </div>
                      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'radial-gradient(circle at center, rgba(18, 140, 126, 0.05), transparent 75%)', overflowY: 'auto' }}>
                        <motion.div initial={{ scale: 0.9, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 16 }} style={{ background: '#056162', color: 'white', padding: '8px 12px', borderRadius: '0px 12px 12px 12px', maxWidth: '90%', fontSize: '10.5px', lineHeight: 1.35, alignSelf: 'flex-start', boxShadow: '0 1.5px 3px rgba(0,0,0,0.18)' }}>
                          <p style={{ margin: 0, fontFamily: 'Outfit, sans-serif' }}>{typedNudge || 'Routing Nudge...'}</p>
                          <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: '3px', fontFamily: 'JetBrains Mono, monospace' }}>
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ color: '#34b7f1', marginLeft: '3px' }}>✓✓</span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
      <style>{`
        .workspace-split { display:flex; flex-direction:row; flex:1; }
        @media(max-width:900px){
          .workspace-split { flex-direction:column!important; }
          .workspace-split>div:first-child { border-right:none!important; border-bottom:1px solid rgba(255,255,255,0.06)!important; }
        }
      `}</style>
    </motion.section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── FEATURES GRID – ANIMATED BENTO WITH UNIQUE MICRO-INTERACTIONS ──
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedProgressBar = ({ value, color }: { value: number; color: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: inView ? `${value}%` : 0 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} style={{ height: '100%', background: color, borderRadius: '4px', boxShadow: `0 0 8px ${color}66` }} />
    </div>
  );
};

const FeaturesGrid = () => {
  const [toggleActive, setToggleActive] = useState(true);
  const [parserHov, setParserHov] = useState(false);

  const cardAnim = (dir: 'left' | 'right' | 'up' | 'scale') => ({
    hidden: dir === 'left' ? { opacity: 0, x: -50 } : dir === 'right' ? { opacity: 0, x: 50 } : dir === 'up' ? { opacity: 0, y: 50 } : { opacity: 0, scale: 0.88 },
    show: { opacity: 1, x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 75, damping: 14 } }
  });

  return (
    <section id="features" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 700, color: C.indigo, textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(99,102,241,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(99,102,241,0.07)', display: 'inline-block', marginBottom: '16px' }}>
          Core Capabilities
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: '0' }}>
          Engineered for{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', background: `linear-gradient(90deg,${C.teal},${C.indigo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>financial clarity.</span>
        </motion.h2>
      </div>

      <style>{`
        .feat-grid { display:grid; grid-template-columns:repeat(3,1fr); grid-auto-rows:minmax(240px,auto); gap:20px; }
        .feat-span2 { grid-column:span 2; }
        @media(max-width:1024px){ .feat-grid { grid-template-columns:repeat(2,1fr)!important; } .feat-span2 { grid-column:span 2!important; } }
        @media(max-width:640px){ .feat-grid { grid-template-columns:1fr!important; grid-auto-rows:auto!important; } .feat-span2 { grid-column:span 1!important; } }
      `}</style>

      <div className="feat-grid">
        {/* Card 1: LangGraph Network – large, slides left */}
        <motion.div variants={cardAnim('left')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="feat-span2">
          <SpotlightCard glowColor="rgba(20,184,166,0.12)" style={{ background: 'rgba(6,6,18,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(20px)', height: '100%' }}>
            <div style={{ padding: '30px', display: 'flex', gap: '32px', height: '100%', alignItems: 'center', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              {/* Watermark */}
              <div style={{ position: 'absolute', right: '10px', bottom: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '7.5px', color: 'rgba(255,255,255,0.02)', lineHeight: 1.5 }}>cargo run --bin supervisor<br />ingesting STATEMENT_LOG_001.csv...</div>

              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `rgba(20,184,166,0.12)`, border: `1px solid rgba(20,184,166,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={18} color={C.teal} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', color: C.teal, fontWeight: 700 }}>LOGIC PIPELINE</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>LangGraph Supervisor Network</h3>
                <p style={{ color: C.textMuted, fontSize: '14px', margin: 0, lineHeight: 1.65 }}>
                  Agent nodes route bank statements to individual regressors, checking calculations and auditing advice against GDPR criteria automatically.
                </p>
                {/* Mini pipeline indicator */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                  {['Parser', 'Regressor', 'Supervisor'].map((n, i) => (
                    <React.Fragment key={n}>
                      <motion.div animate={{ boxShadow: [`0 0 0px ${C.teal}`, `0 0 12px ${C.teal}88`, `0 0 0px ${C.teal}`] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }} style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(20,184,166,0.08)', border: `1px solid rgba(20,184,166,0.2)`, fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: C.teal, fontWeight: 700 }}>{n}</motion.div>
                      {i < 2 && <div style={{ width: '18px', height: '1px', background: `linear-gradient(90deg, ${C.teal}66, transparent)` }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* SVG mini graph */}
              <div style={{ width: '180px', height: '130px', flexShrink: 0, zIndex: 1 }}>
                <svg width="100%" height="100%" viewBox="0 0 180 130">
                  <defs><radialGradient id="ng1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.teal} stopOpacity="0.3" /><stop offset="100%" stopColor={C.teal} stopOpacity="0" /></radialGradient></defs>
                  {[[25,65,'Parser'],[90,30,'Classifier'],[90,100,'Regressor'],[155,65,'Supervisor']].map(([x,y,l], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="16" fill="#03030c" stroke={[C.teal,C.indigo,C.pink,C.teal][i]} strokeWidth="1.5" />
                      <motion.circle cx={x} cy={y} r="20" fill="none" stroke={[C.teal,C.indigo,C.pink,C.teal][i]} strokeWidth="1" initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.8, 0.3], r: [20, 25, 20] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }} />
                      <text x={x} y={Number(y)+4} textAnchor="middle" fontSize="7" fill="white" fontFamily="JetBrains Mono">{String(l).substring(0,4)}</text>
                    </g>
                  ))}
                  {[[25,65,90,30],[25,65,90,100],[90,30,155,65],[90,100,155,65]].map(([x1,y1,x2,y2], i) => (
                    <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" strokeDasharray="4,4" animate={{ strokeDashoffset: [0,-16] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.3 }} />
                  ))}
                </svg>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 2: Parser – scales up */}
        <motion.div variants={cardAnim('scale')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} onMouseEnter={() => setParserHov(true)} onMouseLeave={() => setParserHov(false)}>
          <SpotlightCard glowColor="rgba(99,102,241,0.12)" style={{ background: 'rgba(6,6,18,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(20px)', height: '100%', cursor: 'default' }}>
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(99,102,241,0.12)', border: `1px solid rgba(99,102,241,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={16} color={C.indigo} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.indigo, fontWeight: 700 }}>PARSER CORE</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: parserHov ? '#22c55e' : C.textFaint, fontWeight: 700, transition: 'color 0.3s' }}>{parserHov ? 'PARSING...' : 'IDLE'}</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Statement Parser</h3>
              <p style={{ color: C.textMuted, fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>Ingests raw transaction logs, structuring values into secure datasets.</p>
              {/* File format badges */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['.csv', '.pdf', '.xlsx'].map(ext => (
                  <motion.div key={ext} animate={{ scale: parserHov ? [1, 1.08, 1] : 1 }} transition={{ duration: 0.5, delay: ext === '.pdf' ? 0.1 : ext === '.xlsx' ? 0.2 : 0 }} style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.07)', border: `1px solid rgba(99,102,241,0.18)`, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.indigo, fontWeight: 700 }}>{ext}</motion.div>
                ))}
              </div>
              {/* Animated parse progress */}
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>
                  <span>Parse rate</span><span style={{ color: parserHov ? '#22c55e' : C.textFaint }}>{parserHov ? '99.7%' : '0%'}</span>
                </div>
                <AnimatedProgressBar value={parserHov ? 99.7 : 0} color={C.indigo} />
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 3: WhatsApp Nudge – slides up, full wide */}
        <motion.div variants={cardAnim('up')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="feat-span2">
          <SpotlightCard glowColor="rgba(236,72,153,0.12)" style={{ background: 'rgba(6,6,18,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(20px)', height: '100%' }}>
            <div style={{ padding: '30px', display: 'flex', gap: '32px', height: '100%', alignItems: 'center', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236,72,153,0.1)', border: `1px solid rgba(236,72,153,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={18} color={C.pink} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', color: C.pink, fontWeight: 700 }}>NUDGE ROUTER</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Instant WhatsApp Nudges</h3>
                <p style={{ color: C.textMuted, fontSize: '14px', margin: 0, lineHeight: 1.65 }}>
                  Behavioral coach messages explain exactly which spending patterns are draining your runway — no dashboard checks required.
                </p>
                {/* Animated nudge pill */}
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} style={{ marginTop: '8px', background: 'rgba(6,6,18,0.6)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '14px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <motion.div animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.pink, boxShadow: `0 0 8px ${C.pink}`, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.4 }}>Kira: Food Delivery limits crossed. Freeze Swiggy 3 days → +4 runway days.</span>
                </motion.div>
              </div>

              {/* Delivery metrics */}
              <div style={{ width: '160px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[{ label: 'Alerts Sent', val: '2.4K', color: C.pink }, { label: 'Avg Saved', val: '₹3,800', color: C.teal }, { label: 'Response Time', val: '<2 sec', color: C.indigo }].map(s => (
                  <div key={s.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: '12px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.textFaint, marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 900, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 4: Circuit Breaker – slides right */}
        <motion.div variants={cardAnim('right')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <SpotlightCard glowColor="rgba(20,184,166,0.1)" style={{ background: 'rgba(6,6,18,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(20px)', height: '100%' }}>
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(20,184,166,0.1)', border: `1px solid rgba(20,184,166,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={16} color={C.teal} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.teal, fontWeight: 700 }}>CIRCUIT BREAKER</span>
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Privacy Isolation</h3>
              <p style={{ color: C.textMuted, fontSize: '13.5px', margin: 0, lineHeight: 1.6 }}>Strict breaker policies shield credential schemas from any model timeout or breach.</p>
              {/* Interactive Switch */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, padding: '10px 16px', borderRadius: '12px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: toggleActive ? '#4ade80' : C.textFaint, fontWeight: 700, textShadow: toggleActive ? '0 0 8px rgba(74,222,128,0.4)' : 'none', transition: 'all 0.3s' }}>{toggleActive ? 'SECURED' : 'EXPOSED'}</span>
                <button onClick={() => setToggleActive(!toggleActive)} style={{ width: '38px', height: '20px', borderRadius: '99px', background: toggleActive ? '#22c55e' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', padding: '2px', transition: 'background 0.3s', boxShadow: toggleActive ? '0 0 12px rgba(34,197,94,0.45)' : 'none' }}>
                  <motion.div layout style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', left: toggleActive ? '20px' : '2px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                </button>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── HOW IT WORKS – WAVY SVG TIMELINE WITH FLOWING LASER PULSES ──
// ─────────────────────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { title: 'Statement Ingestion', desc: 'Securely upload bank statement templates. Kira structures rows automatically into a clean dataset.', icon: <Database size={20} />, color: C.indigo },
    { title: 'UPI De-identification', desc: 'One-way cryptographic masking trims merchant identity fields before any LLM categorization.', icon: <Lock size={20} />, color: C.pink },
    { title: 'Runway Regression', desc: 'Algorithms project daily cash balances forward to calculate exact exhaustion dates.', icon: <BarChart3 size={20} />, color: C.teal },
    { title: 'LangGraph Auditing', desc: 'Supervisor nodes audit generated coach alerts for tone, compliance, and behavioral accuracy.', icon: <Cpu size={20} />, color: '#f59e0b' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.9 }} id="howitworks" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '72px' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 700, color: C.pink, textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(236,72,153,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(236,72,153,0.07)', display: 'inline-block', marginBottom: '16px' }}>Pipeline Architecture</motion.div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: 0 }}>
          How it{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', color: C.pink }}>works.</span>
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '64px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Step list */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {steps.map((step, i) => {
            const isActive = activeStep === i;
            return (
              <motion.div key={i} onClick={() => setActiveStep(i)} whileHover={{ x: 4 }} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', cursor: 'pointer', padding: '18px 20px', borderRadius: '18px', background: isActive ? `rgba(99,102,241,0.06)` : 'transparent', border: isActive ? `1px solid rgba(99,102,241,0.18)` : '1px solid transparent', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', boxShadow: isActive ? `0 8px 28px rgba(0,0,0,0.35)` : 'none' }}>
                {/* Step icon */}
                <motion.div animate={{ background: isActive ? step.color : 'rgba(255,255,255,0.04)', boxShadow: isActive ? `0 0 20px ${step.color}55` : 'none' }} transition={{ duration: 0.3 }} style={{ width: '48px', height: '48px', borderRadius: '14px', border: isActive ? `2px solid ${step.color}` : `1px solid rgba(255,255,255,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'white' : C.textFaint, flexShrink: 0, transition: 'color 0.3s' }}>
                  {step.icon}
                </motion.div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9.5px', color: step.color, fontWeight: 700 }}>STEP {i + 1}</span>
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: isActive ? 'white' : 'rgba(200,210,255,0.65)', margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif', transition: 'color 0.3s' }}>{step.title}</h4>
                  <p style={{ color: isActive ? C.textMuted : C.textFaint, fontSize: '13px', margin: 0, lineHeight: 1.55, transition: 'color 0.3s' }}>{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* SVG wave pipeline */}
        <div style={{ flex: 1.1, minWidth: '300px' }}>
          <SpotlightCard glowColor="rgba(99,102,241,0.1)" style={{ padding: '32px', background: 'rgba(6,6,18,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.textFaint, fontWeight: 600 }}>LANGGRAPH STATE MAP</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9.5px', background: 'rgba(99,102,241,0.1)', color: C.indigo, padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>INTERACTIVE</span>
            </div>
            <div style={{ height: '260px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 260" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  {steps.map((s, i) => (
                    <radialGradient key={i} id={`ng${i}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                    </radialGradient>
                  ))}
                </defs>
                {/* Wavy paths */}
                {[
                  { d: 'M 55,70 C 110,70 130,130 200,130', color: C.indigo, idx: 0 },
                  { d: 'M 200,130 C 260,130 280,70 340,70', color: C.pink, idx: 1 },
                  { d: 'M 55,190 C 110,190 130,130 200,130', color: C.teal, idx: 2 },
                  { d: 'M 200,130 C 260,130 280,190 340,190', color: '#f59e0b', idx: 3 },
                ].map(({ d, color, idx }) => (
                  <g key={idx}>
                    <path d={d} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                    <motion.path d={d} fill="none" stroke={color} strokeWidth={activeStep === idx ? '2.5' : '1'} strokeDasharray="6,4" animate={activeStep === idx ? { strokeDashoffset: [0, -20] } : { strokeDashoffset: 0 }} transition={activeStep === idx ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}} style={{ opacity: activeStep === idx ? 1 : 0.2, transition: 'all 0.4s' }} />
                    {activeStep === idx && (
                      <motion.circle r="5" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
                        <animateMotion dur="1.2s" repeatCount="indefinite" path={d} />
                      </motion.circle>
                    )}
                  </g>
                ))}
                {/* Nodes */}
                {[
                  { x: 55, y: 70, label: 'Parser', i: 0 },
                  { x: 55, y: 190, label: 'Regressor', i: 2 },
                  { x: 200, y: 130, label: 'Supervisor', i: null },
                  { x: 340, y: 70, label: 'Classifier', i: 1 },
                  { x: 340, y: 190, label: 'Dispatcher', i: 3 },
                ].map(({ x, y, label, i }, ni) => {
                  const isAct = i !== null ? activeStep === i : false;
                  const nodeColor = i !== null ? steps[i].color : C.indigo;
                  return (
                    <g key={ni}>
                      {isAct && <motion.circle cx={x} cy={y} r="22" fill="none" stroke={nodeColor} strokeWidth="1" initial={{ scale: 0.8, opacity: 0.5 }} animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.8, repeat: Infinity }} />}
                      <circle cx={x} cy={y} r="16" fill="#03030c" stroke={isAct ? nodeColor : 'rgba(255,255,255,0.1)'} strokeWidth={isAct ? '2' : '1.2'} />
                      <circle cx={x} cy={y} r="5" fill={nodeColor} style={{ opacity: isAct ? 1 : 0.4 }} />
                      <text x={x} y={y + 30} textAnchor="middle" fontSize="9" fill={isAct ? 'white' : 'rgba(200,210,255,0.35)'} fontFamily="JetBrains Mono" fontWeight={isAct ? '700' : '400'}>{label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </motion.section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── SECURITY – THREAT MAP COMMAND CENTER ──
// ─────────────────────────────────────────────────────────────────────────────
const SecuritySection = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const items = [
    { title: 'Immutable SHA-256 Hashed Logs', desc: 'Every logic audit trail is printed cryptographically to local JSON Lines streams.', icon: <Database size={18} />, tag: 'IMMUTABLE', color: C.teal },
    { title: 'One-Way UPI De-identification', desc: 'Raw UPI merchant names are regex-scrubbed before hitting any LLM pipeline.', icon: <Lock size={18} />, tag: 'SANDBOXED', color: C.indigo },
    { title: '90-Day Auto Log Purges', desc: 'Analytics buffers sit strictly inside volatile local memory with strict TTLs.', icon: <Calendar size={18} />, tag: 'VOLATILE', color: C.pink },
    { title: 'Circuit Breaker Policies', desc: 'Any agent timeout triggers immediate fallback and state recovery without data leakage.', icon: <Shield size={18} />, tag: 'SHIELDED', color: '#f59e0b' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.9 }} id="security" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(20,184,166,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(20,184,166,0.07)', display: 'inline-block', marginBottom: '16px' }}>Secured by Architecture</motion.div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: '0 0 16px 0' }}>
          Privacy-centric{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', color: C.teal }}>governance.</span>
        </h2>
        <p style={{ color: C.textMuted, fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto' }}>Kira reads statements in sandboxed stores, masked merchant codes, and immediate session purges.</p>
      </div>

      {/* Threat map top panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} style={{ background: 'rgba(6,6,18,0.7)', border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px 28px', marginBottom: '24px', backdropFilter: 'blur(20px)', overflow: 'hidden', position: 'relative' }}>
        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={16} color={C.teal} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: C.textFaint, fontWeight: 600 }}>KIRA_THREAT_COMMAND_CENTER</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[{ label: 'THREAT LEVEL', val: 'LOW', color: '#22c55e' }, { label: 'BREACHES', val: '0', color: C.teal }, { label: 'UPTIME', val: '99.97%', color: C.indigo }].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: C.textFaint, letterSpacing: '0.5px' }}>{s.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: s.color, fontWeight: 800 }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Latency meters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[{ label: 'Parser latency', val: 95 }, { label: 'Classifier latency', val: 78 }, { label: 'Network integrity', val: 100 }, { label: 'Audit compliance', val: 88 }].map((m, i) => (
            <div key={i} style={{ flex: '1 1 140px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.textFaint }}>{m.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.teal }}>{m.val}%</span>
              </div>
              <AnimatedProgressBar value={m.val} color={m.val > 90 ? C.teal : C.indigo} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security cards grid */}
      <style>{`
        .sec-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; }
        @media(max-width:768px){ .sec-grid { grid-template-columns:1fr!important; } }
      `}</style>
      <div className="sec-grid">
        {items.map((item, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} onClick={() => setActiveIdx(activeIdx === idx ? null : idx)} style={{ cursor: 'pointer' }}>
            <SpotlightCard glowColor={`${item.color}15`} style={{ background: activeIdx === idx ? `rgba(6,6,18,0.8)` : 'rgba(6,6,18,0.5)', border: activeIdx === idx ? `1px solid ${item.color}44` : `1px solid ${C.border}`, backdropFilter: 'blur(20px)', transition: 'all 0.3s', boxShadow: activeIdx === idx ? `0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${item.color}15` : 'none' }}>
              <div style={{ padding: '26px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: `${item.color}15`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                      {item.icon}
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'white', fontFamily: 'Outfit, sans-serif', lineHeight: 1.3 }}>{item.title}</h3>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8.5px', padding: '3px 8px', borderRadius: '6px', background: `${item.color}10`, color: item.color, border: `1px solid ${item.color}28`, fontWeight: 700, flexShrink: 0 }}>{item.tag}</span>
                </div>
                <AnimatePresence>
                  {activeIdx === idx && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: C.textMuted, fontSize: '13.5px', lineHeight: 1.65, margin: 0 }}>{item.desc}</motion.p>
                  )}
                </AnimatePresence>
                {activeIdx !== idx && <p style={{ color: C.textFaint, fontSize: '13.5px', lineHeight: 1.65, margin: 0 }}>{item.desc.substring(0, 70)}...</p>}
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── PRICING – FROSTED GLASS CARDS WITH FLIP PRICE ANIMATION ──
// ─────────────────────────────────────────────────────────────────────────────
const PricingSection = ({ onSelectPlan }: { onSelectPlan: (plan: any) => void }) => {
  const [yearly, setYearly] = useState(false);
  const plans = [
    { name: 'Local Sandbox', price: 0, pricey: 0, period: 'forever', desc: 'Local statement analysis, basic runway modeling.', features: ['1 Statement file/week', '14-Day runway model', 'Standard coach alerts', 'Browser session storage'], button: 'Deploy Free', popular: false, accent: C.teal, glow: 'rgba(20,184,166,0.12)' },
    { name: 'Pro Pilot', price: 799, pricey: 599, period: '/month', desc: 'Automatic nodes, cap targets, WhatsApp alerts.', features: ['Unlimited parsing', '90-Day regression model', 'Direct WhatsApp nudges', 'LangGraph Supervisor audit', 'Priority updates'], button: 'Deploy Pro', popular: true, accent: C.indigo, glow: 'rgba(99,102,241,0.2)' },
    { name: 'Builder Pro', price: 2499, pricey: 1999, period: '/month', desc: 'Private Docker model, webhooks, team controls.', features: ['Everything in Pro Pilot', 'Private Docker container', 'Custom webhooks', 'Fine-tuned local LLM', 'Slack integration', '24/7 Priority support'], button: 'Deploy Builder', popular: false, accent: C.pink, glow: 'rgba(236,72,153,0.12)' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.9 }} id="pricing" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 700, color: C.indigo, textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(99,102,241,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(99,102,241,0.07)', display: 'inline-block', marginBottom: '16px' }}>Deployment Tiers</motion.div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: '0 0 12px 0' }}>
          Flexible{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', background: `linear-gradient(90deg,${C.indigo},${C.pink})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>pricing tiers.</span>
        </h2>
        <p style={{ color: C.textMuted, fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 28px' }}>Align your deployment with your financial security criteria. Upgrade nodes any time.</p>
        {/* Toggle */}
        <div style={{ display: 'inline-flex', background: C.surface, padding: '4px', borderRadius: '99px', border: `1px solid ${C.border}` }}>
          {['Monthly', 'Yearly'].map((p, i) => (
            <button key={p} onClick={() => setYearly(i === 1)} style={{ background: yearly === (i === 1) ? 'white' : 'transparent', color: yearly === (i === 1) ? 'black' : C.textMuted, border: 'none', padding: '8px 24px', borderRadius: '99px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Outfit, sans-serif' }}>
              {p}
              {i === 1 && <span style={{ fontSize: '9px', background: C.gradH, color: 'white', padding: '2px 6px', borderRadius: '99px', fontWeight: 800 }}>−25%</span>}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .price-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; align-items:stretch; }
        @media(max-width:900px){ .price-grid { grid-template-columns:1fr!important; gap:20px!important; } }
      `}</style>
      <div className="price-grid">
        {plans.map((plan, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.12 }} whileHover={{ y: -6, transition: { type: 'spring', stiffness: 280, damping: 22 } }}>
            <SpotlightCard glowColor={plan.glow} style={{ background: plan.popular ? 'rgba(12,12,30,0.85)' : 'rgba(6,6,18,0.65)', border: plan.popular ? `2px solid ${plan.accent}66` : `1px solid ${C.border}`, backdropFilter: 'blur(24px)', height: '100%', position: 'relative', boxShadow: plan.popular ? `0 20px 60px rgba(0,0,0,0.6), 0 0 30px ${plan.accent}15` : 'none' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: C.gradH, color: 'white', fontSize: '10px', fontWeight: 900, padding: '4px 18px', borderRadius: '99px', letterSpacing: '0.5px', fontFamily: 'JetBrains Mono, monospace', boxShadow: `0 4px 14px rgba(99,102,241,0.45)`, whiteSpace: 'nowrap' }}>★ MOST POPULAR</div>
              )}
              <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${plan.accent}18`, border: `1px solid ${plan.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Server size={16} color={plan.accent} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'white', fontFamily: 'Outfit, sans-serif' }}>{plan.name}</h3>
                </div>
                <p style={{ color: C.textMuted, fontSize: '13px', lineHeight: 1.5, margin: '0 0 24px 0' }}>{plan.desc}</p>
                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px', height: '52px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '16px', color: C.textMuted, alignSelf: 'center' }}>₹</span>
                  <AnimatePresence mode="wait">
                    <motion.span key={yearly ? 'y' : 'm'} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }} style={{ fontSize: '46px', fontWeight: 900, color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                      {plan.price === 0 ? '0' : (yearly ? plan.pricey : plan.price).toLocaleString()}
                    </motion.span>
                  </AnimatePresence>
                  <span style={{ color: C.textFaint, fontSize: '13px' }}>{plan.period}</span>
                </div>
                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '28px' }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: `${plan.accent}18`, border: `1px solid ${plan.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={10} color={plan.accent} />
                      </div>
                      <span style={{ fontSize: '13px', color: C.textMuted }}>{f}</span>
                    </div>
                  ))}
                </div>
                {/* Button */}
                <motion.button onClick={() => onSelectPlan(plan)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: '100%', background: plan.popular ? C.gradH : 'transparent', color: 'white', border: plan.popular ? 'none' : `1px solid ${C.border}`, padding: '14px 24px', borderRadius: '99px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: plan.popular ? `0 8px 28px rgba(99,102,241,0.35)` : 'none', fontFamily: 'Outfit, sans-serif' }}>
                  {plan.button}
                </motion.button>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── CHECKOUT MODAL WITH CARD FLIP ──
// ─────────────────────────────────────────────────────────────────────────────
const CheckoutModal = ({ plan, onClose }: { plan: any; onClose: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [focused, setFocused] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fmt = (v: string) => { const n = v.replace(/\s+/g, '').replace(/[^0-9]/gi, ''); const m = n.match(/\d{4,16}/g); const r = (m?.[0]) || ''; const p = []; for (let i = 0; i < r.length; i += 4) p.push(r.substring(i, i + 4)); return p.length ? p.join(' ') : n; };
  const fmtExp = (v: string) => { let n = v.replace(/[^0-9]/g, ''); if (n.length >= 2) n = n.substring(0, 2) + '/' + n.substring(2, 4); return n.substring(0, 5); };
  const handle = (e: React.FormEvent) => { e.preventDefault(); if (!name || !email || !cardNumber || !expiry || !cvc) return; setLoading(true); setTimeout(() => { setLoading(false); setSuccess(true); }, 1800); };
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '11px 14px', color: 'white', fontSize: '13.5px', outline: 'none', fontFamily: 'Outfit, sans-serif', width: '100%', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.5px' };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,3,12,0.88)', backdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '24px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }} style={{ width: '100%', maxWidth: '480px', background: 'rgba(8,8,20,0.97)', border: `1px solid rgba(99,102,241,0.3)`, borderRadius: '24px', padding: '36px', boxShadow: `0 40px 120px rgba(0,0,0,0.95), 0 0 60px rgba(99,102,241,0.12)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '160px', height: '160px', background: `radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />
        {success ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}>
              <Check size={38} color="#22c55e" />
            </motion.div>
            <div><h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>Node Connected!</h3><p style={{ color: C.textMuted, fontSize: '14px', lineHeight: 1.6, fontFamily: 'Outfit, sans-serif' }}>Your {plan.name} deployment is active. Supervisor agents are now parsing.</p></div>
            <button onClick={onClose} style={{ width: '100%', background: 'linear-gradient(90deg,#22c55e,#10b981)', color: 'white', border: 'none', padding: '14px', borderRadius: '99px', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Go to Dashboard</button>
          </div>
        ) : (
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Deploy {plan.name}</h3><span style={{ fontSize: '12px', color: C.textMuted }}>Enter payment details securely</span></div>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.textFaint, cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            {/* Card flip */}
            <div style={{ perspective: '1000px', height: '140px' }}>
              <motion.div animate={{ rotateY: focused === 'cvc' ? 180 : 0 }} transition={{ type: 'spring', stiffness: 150, damping: 20 }} style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', borderRadius: '16px' }}>
                <div style={{ position: 'absolute', inset: 0, padding: '20px', backfaceVisibility: 'hidden', background: `linear-gradient(135deg, ${plan.accent || C.indigo}, ${C.pink})`, borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white', boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', fontWeight: 700 }}>Kira Visa Mock</span><span>⚡</span></div>
                  <div style={{ fontSize: '16px', letterSpacing: '2.5px', fontFamily: 'JetBrains Mono, monospace' }}>{cardNumber || '•••• •••• •••• ••••'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}><div><span style={{ opacity: 0.5, fontSize: '8px', display: 'block' }}>CARDHOLDER</span>{name || 'JOHN DOE'}</div><div><span style={{ opacity: 0.5, fontSize: '8px', display: 'block' }}>EXPIRES</span>{expiry || 'MM/YY'}</div></div>
                </div>
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: `linear-gradient(135deg, #4f1e99, #a0005b)`, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0' }}>
                  <div style={{ background: '#111', height: '38px', width: '100%', marginTop: '20px' }} />
                  <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}><div style={{ background: 'white', color: 'black', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', minWidth: '44px', textAlign: 'center' }}>{cvc || '•••'}</div></div>
                </div>
              </motion.div>
            </div>
            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}><label style={labelStyle}>Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} onFocus={() => setFocused('name')} placeholder="John Doe" required style={inputStyle} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}><label style={labelStyle}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocused('email')} placeholder="john@example.com" required style={inputStyle} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}><label style={labelStyle}>Card Number</label><input type="text" value={cardNumber} onChange={e => setCardNumber(fmt(e.target.value))} onFocus={() => setFocused('number')} placeholder="4111 2222 3333 4444" maxLength={19} required style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }} /></div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}><label style={labelStyle}>Expires</label><input type="text" value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))} onFocus={() => setFocused('expiry')} placeholder="MM/YY" maxLength={5} required style={{ ...inputStyle, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }} /></div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}><label style={labelStyle}>CVC</label><input type="password" value={cvc} onChange={e => setCvc(e.target.value.replace(/[^0-9]/g, ''))} onFocus={() => setFocused('cvc')} onBlur={() => setFocused('')} placeholder="•••" maxLength={3} required style={{ ...inputStyle, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }} /></div>
            </div>
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: '100%', background: C.gradH, color: 'white', border: 'none', padding: '14px', borderRadius: '99px', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer', marginTop: '6px', boxShadow: `0 6px 20px rgba(99,102,241,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif' }}>
              {loading ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Processing...</> : 'Deploy Plan'}
            </motion.button>
          </form>
        )}
      </motion.div>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── DUAL-DIRECTION TECH MARQUEE ──
// ─────────────────────────────────────────────────────────────────────────────
const TechMarquee = () => {
  const row1 = ['React 18', 'TypeScript', 'Framer Motion', 'LangGraph', 'Gemini Flash', 'FastAPI', 'Vite', 'Python 3.11', 'Zustand', 'Recharts', 'JetBrains Mono'];
  const row2 = ['Prometheus', 'SlowAPI', 'WebSockets', 'Pydantic', 'Uvicorn', 'NumPy', 'Pandas', 'Docker', 'Redis', 'OpenAI SDK', 'LangChain'];
  const colors = [C.indigo, C.pink, C.teal, '#f59e0b', '#22c55e'];

  const Row = ({ items, dir }: { items: string[]; dir: 'left' | 'right' }) => {
    const doubled = [...items, ...items];
    return (
      <div style={{ display: 'flex', gap: '16px', width: 'max-content', animation: `marquee-${dir} 28s linear infinite` }}>
        {doubled.map((t, i) => (
          <div key={i} className="tech-chip" style={{ padding: '9px 22px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '99px', fontSize: '12.5px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: C.textMuted, cursor: 'default', transition: 'all 0.3s', whiteSpace: 'nowrap' }}>
            <span style={{ color: colors[i % colors.length], marginRight: '6px', opacity: 0.6 }}>◆</span>
            {t}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div id="stack" style={{ padding: '56px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.008)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      <div style={{ maskImage: 'linear-gradient(90deg,transparent,black 12%,black 88%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,black 12%,black 88%,transparent)' }}>
        <div style={{ overflow: 'hidden', marginBottom: '16px' }}><Row items={row1} dir="left" /></div>
        <div style={{ overflow: 'hidden' }}><Row items={row2} dir="right" /></div>
      </div>
      <style>{`
        @keyframes marquee-left { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes marquee-right { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
        .tech-chip:hover { background:rgba(99,102,241,0.1)!important; color:#a5b4fc!important; border-color:rgba(99,102,241,0.28)!important; }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── FINAL CTA ──
// ─────────────────────────────────────────────────────────────────────────────
const FinalCTAWithStart = ({ onStart }: { onStart?: () => void }) => {
  return (
    <div style={{ padding: '140px 24px', textAlign: 'center', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', top: '50%', left: '25%', transform: 'translate(-50%,-50%)', width: '320px', height: '320px', background: `radial-gradient(circle,rgba(99,102,241,0.22),transparent 70%)`, filter: 'blur(70px)', zIndex: -1 }} />
      <div style={{ position: 'absolute', top: '50%', right: '25%', transform: 'translate(50%,-50%)', width: '320px', height: '320px', background: `radial-gradient(circle,rgba(236,72,153,0.18),transparent 70%)`, filter: 'blur(70px)', zIndex: -1 }} />

      {/* Stars rating */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginBottom: '28px' }}>
        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13.5px', color: C.textMuted, marginLeft: '8px' }}>9.4 / 10 — Loved by indie builders</span>
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ fontSize: 'clamp(2.2rem,5.5vw,4.2rem)', fontWeight: 900, letterSpacing: '-2px', fontFamily: 'Outfit, sans-serif', color: 'white', margin: '0 0 36px 0', lineHeight: 1.05 }}>
        Ready to master{' '}
        <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>your budget?</span>
      </motion.h2>

      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
        <MagneticButton onClick={onStart} aria-label="Launch Platform">
          <div style={{ padding: '16px 44px', fontSize: '15.5px', background: 'white', borderRadius: '99px', color: 'black', fontWeight: 900, boxShadow: '0 8px 36px rgba(255,255,255,0.2)', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Launch Kira-AI <Zap size={16} fill="currentColor" />
          </div>
        </MagneticButton>
        <a href="https://github.com/Yashaswini-V21/Kira-AI" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ padding: '16px 36px', fontSize: '15px', border: `1px solid ${C.border}`, borderRadius: '99px', color: 'white', fontWeight: 600, background: C.surface, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            View on GitHub
          </motion.div>
        </a>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.35 }} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: C.textFaint, letterSpacing: '2px' }}>
        MIT LICENSE · 93 TESTS PASSED · BUILT WITH GEMINI & LANGGRAPH
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── FOOTER ──
// ─────────────────────────────────────────────────────────────────────────────
const Footer = () => {
  const socials = [
    { label: 'GitHub', href: 'https://github.com/Yashaswini-V21/Kira-AI', color: C.indigo, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg> },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/yashaswini-v21', color: C.teal, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg> },
  ];
  const cols = [
    { title: 'Product', links: [['Features', '#features'], ['Simulator', '#simulator'], ['Security', '#security'], ['Pricing', '#pricing']] },
    { title: 'Resources', links: [['Documentation', '#'], ['Architecture', '#'], ['API Specs', '#'], ['GitHub Repo', 'https://github.com/Yashaswini-V21/Kira-AI']] },
    { title: 'Legal', links: [['Privacy Policy', '#'], ['Terms of Service', '#'], ['GDPR Purge', '#'], ['MIT License', '#']] },
  ];
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, background: '#02020a', padding: '80px 24px 40px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '56px' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', gap: '48px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', color: 'white', boxShadow: `0 0 10px rgba(99,102,241,0.5)` }}>K</div>
              <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif', color: 'white' }}>Kira-AI</span>
            </div>
            <p style={{ color: C.textFaint, fontSize: '13.5px', lineHeight: 1.7, maxWidth: '300px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>An intelligent behavioral finance coach predicting cash runway dates and dispatching warning nudges before the crisis hits.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', background: C.surface, border: `1px solid ${C.border}`, color: 'rgba(200,210,255,0.6)', transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = `${s.color}18`; e.currentTarget.style.borderColor = `${s.color}60`; e.currentTarget.style.color = s.color; }} onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = 'rgba(200,210,255,0.6)'; }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          {/* Link columns */}
          {cols.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '1px' }}>{col.title}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map(([label, href], li) => (
                  <a key={li} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ color: C.textFaint, textDecoration: 'none', fontSize: '13.5px', fontFamily: 'Outfit, sans-serif', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'} onMouseLeave={e => e.currentTarget.style.color = C.textFaint}>{label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '28px', color: C.textFaint, fontSize: '12.5px', fontFamily: 'Outfit, sans-serif' }}>
          <span>© {new Date().getFullYear()} Kira-AI. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px' }}>RELEASE 3.0.0</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px' }}>BUILT WITH GEMINI & LANGGRAPH</span>
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:768px){ .footer-grid { grid-template-columns:1fr!important; gap:32px!important; } }
      `}</style>
    </footer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN LANDING SCREEN EXPORT ──
// ─────────────────────────────────────────────────────────────────────────────
export interface LandingScreenProps { onStart?: () => void; }

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const { scrollYProgress } = useScroll();

  return (
    <div style={{ backgroundColor: C.bg, color: C.textPrimary, minHeight: '100vh', overflowX: 'hidden', fontFamily: 'Outfit, sans-serif' }}>
      <BackgroundEffects scrollYProgress={scrollYProgress} />
      <NavWithStart onStart={onStart} />
      <HeroWithStart onStart={onStart} />
      <StatsStrip />
      <NudgePlayground />
      <FeaturesGrid />
      <HowItWorks />
      <SecuritySection />
      <PricingSection onSelectPlan={(plan) => setSelectedPlan(plan)} />
      <TechMarquee />
      <FinalCTAWithStart onStart={onStart} />
      <Footer />

      <AnimatePresence>
        {selectedPlan && <CheckoutModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
      </AnimatePresence>

      <style>{`
        @keyframes kira-drift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, 4%) scale(1.04); }
          100% { transform: translate(-2%, -3%) scale(0.97); }
        }
        @keyframes kira-grid-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 -72px; }
        }
        @keyframes shiny-anim {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .spotlight-card:hover {
          transform: translateY(-3px);
        }
        .desktop-only { display: flex; }
        .mobile-hamburger-btn { display: none !important; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-hamburger-btn { display: flex !important; }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(200,210,255,0.25); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #03030c; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }
      `}</style>
    </div>
  );
};
