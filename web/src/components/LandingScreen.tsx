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

interface CommandCenterDeckProps {
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  status: 'STANDBY' | 'INGESTING' | 'SECURED';
}

const CommandCenterDeck: React.FC<CommandCenterDeckProps> = ({ logs, setLogs, status }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [scanning, setScanning] = useState(false);

  // Simulated live security stream loop running when standby
  useEffect(() => {
    if (status !== 'STANDBY' || scanning) return;
    const stream = [
      "INGEST: raw statements in volatile RAM.",
      "DECODE: running local Regex scrubbing rules.",
      "REDISP: redacting transaction metadata...",
      "MASKING: Swiggy merchant -> MOCKED_FOOD",
      "MASKING: Uber merchant -> MOCKED_TRANSIT",
      "SECURE: UPI checksum SHA-256 verified.",
      "ROUTE: LangGraph supervisor routing logic.",
      "DISPATCH: lockscreen WhatsApp alert ready."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, `[wasm_dec] ${stream[i]}`];
        if (next.length > 5) next.shift();
        return next;
      });
      setActiveStep(s => (s + 1) % 4);
      i = (i + 1) % stream.length;
    }, 3200);
    return () => clearInterval(interval);
  }, [status, scanning]);

  // Handle manual diagnostic scan trigger
  const triggerScan = () => {
    if (scanning || status === 'INGESTING') return;
    setScanning(true);
    setLogs(prev => [...prev, "SYSTEM: [!] MANUAL SCAN ACTIVATED [!]"]);
    setTimeout(() => { setLogs(prev => [...prev, "SYSTEM: checking SHA-256 integrity..."]); }, 600);
    setTimeout(() => { setLogs(prev => [...prev, "SYSTEM: volatile context scrubbed ✓"]); }, 1400);
    setTimeout(() => {
      setLogs(prev => [...prev, "SYSTEM: Diagnostic check passed. 100% Secure."]);
      setScanning(false);
    }, 2200);
  };

  const isScanning = scanning || status === 'INGESTING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10, rotateY: -15 }}
      animate={{
        opacity: 1,
        y: [0, -8, 0],
        rotateX: [10, 8, 10],
        rotateY: [-15, -12, -15],
        rotateZ: [1.5, 0.8, 1.5]
      }}
      transition={{
        opacity: { duration: 0.8 },
        y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        rotateX: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        rotateY: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        rotateZ: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
      }}
      style={{
        width: '100%',
        maxWidth: '480px',
        height: '460px',
        background: 'rgba(3, 3, 10, 0.82)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: status === 'SECURED' ? '1px solid rgba(34, 197, 94, 0.5)' : (status === 'INGESTING' ? '1px solid rgba(20, 184, 166, 0.5)' : '1px solid rgba(99, 102, 241, 0.35)'),
        borderRadius: '28px',
        padding: '24px',
        boxShadow: status === 'SECURED' ? '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(34, 197, 94, 0.15)' : '0 30px 80px rgba(0,0,0,0.85), 0 0 40px rgba(99, 102, 241, 0.15), inset 0 0 25px rgba(255,255,255,0.01)',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: 'perspective(1200px) rotateX(10deg) rotateY(-15deg) rotateZ(1.5deg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        transition: 'border-color 0.5s, box-shadow 0.5s'
      }}
    >
      {/* Laser Scanning overlay when active */}
      {isScanning && (
        <motion.div
          initial={{ top: '0%' }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '4px',
            background: status === 'INGESTING' ? 'linear-gradient(90deg, transparent, #14b8a6, transparent)' : 'linear-gradient(90deg, transparent, #14b8a6, #6366f1, #14b8a6, transparent)',
            boxShadow: '0 0 15px #14b8a6, 0 0 5px #6366f1',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Terminal Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={12} color={C.indigo} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.textMuted, fontWeight: 700 }}>kira-privacy-vault://core-deck</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="animate-pulse" style={{ width: '5px', height: '5px', borderRadius: '50%', background: isScanning ? '#14b8a6' : (status === 'SECURED' ? '#22c55e' : '#6366f1'), boxShadow: isScanning ? '0 0 8px #14b8a6' : '0 0 8px #22c55e' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: isScanning ? '#14b8a6' : (status === 'SECURED' ? '#22c55e' : '#6366f1'), fontWeight: 800 }}>
            {status === 'INGESTING' ? 'INGESTING' : (status === 'SECURED' ? 'SECURED ✓' : 'STANDBY')}
          </span>
        </div>
      </div>

      {/* Futuristic Circular Visualizer Target Grid */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '16px 0', zIndex: 2 }}>
        
        {/* Animated HUD Sweeper */}
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: status === 'SECURED' ? '1.5px dashed rgba(34, 197, 94, 0.45)' : '1.5px dashed rgba(99, 102, 241, 0.35)',
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              border: status === 'SECURED' ? '1.5px dotted rgba(34, 197, 94, 0.35)' : '1.5px dotted rgba(20, 184, 166, 0.4)',
            }}
          />
          <motion.div
            animate={{ scale: isScanning ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              width: '50%',
              height: '50%',
              borderRadius: '50%',
              background: status === 'SECURED' ? 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              border: status === 'SECURED' ? '1.5px solid rgba(34, 197, 94, 0.6)' : '1.5px solid rgba(99, 102, 241, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: status === 'SECURED' ? '0 0 20px rgba(34,197,94,0.3)' : '0 0 15px rgba(99,102,241,0.2)'
            }}
          >
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: status === 'SECURED' ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'linear-gradient(135deg, #14b8a6, #6366f1)', boxShadow: status === 'SECURED' ? '0 0 10px #22c55e' : '0 0 10px #14b8a6' }} />
          </motion.div>

          <svg width="100%" height="100%" style={{ position: 'absolute', pointerEvents: 'none', overflow: 'visible' }}>
            <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          </svg>
        </div>

        {/* Diagnostic Action Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '160px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 14px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: C.textFaint }}>DECRYPT_THROUGHPUT</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: status === 'SECURED' ? '#22c55e' : '#14b8a6', fontWeight: 800, transition: 'color 0.3s' }}>
              {status === 'SECURED' ? '100% SECURED' : (status === 'INGESTING' ? 'PROCESSING...' : '100% CLIENT_ONLY')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 14px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: C.textFaint }}>VOLATILE_MEMORY_TTL</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: C.pink, fontWeight: 800 }}>ZERO_RETENTION</span>
          </div>

          <motion.button
            whileHover={{ scale: isScanning ? 1 : 1.03, boxShadow: isScanning ? 'none' : '0 4px 12px rgba(20,184,166,0.3)' }}
            whileTap={{ scale: isScanning ? 1 : 0.98 }}
            onClick={triggerScan}
            disabled={isScanning}
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: isScanning ? 'rgba(20,184,166,0.1)' : 'rgba(99, 102, 241, 0.1)',
              border: isScanning ? '1px solid rgba(20,184,166,0.4)' : '1px solid rgba(99, 102, 241, 0.4)',
              color: isScanning ? '#14b8a6' : C.indigo,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9.5px',
              fontWeight: 800,
              cursor: isScanning ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Activity size={12} className={isScanning ? "animate-pulse" : ""} />
            {status === 'INGESTING' ? 'INGESTING...' : (scanning ? 'AUDITING...' : 'RUN SECURITY CHECK')}
          </motion.button>
        </div>
      </div>

      {/* Live Log Ticker Block */}
      <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '130px', zIndex: 2 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7.5px', color: C.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>VOLATILE COCKPIT TRACE</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
          {logs.map((log, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                color: log.includes('SYSTEM') ? '#ffbd2e' : (log.includes('Secure') || log.includes('passed') || log.includes('SECURED') ? '#22c55e' : 'rgba(250,250,250,0.65)'),
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                lineHeight: 1.3
              }}
            >
              <span style={{ color: C.indigo }}>&gt;</span>
              <span>{log}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const HeroWithStart = ({ onStart }: { onStart?: () => void }) => {
  const [activePipeline, setActivePipeline] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<'STANDBY' | 'INGESTING' | 'SECURED'>('STANDBY');
  const [activeLogs, setActiveLogs] = useState<string[]>([
    "INIT: Isolated WASM sandbox active.",
    "SCAN: Awaiting browser statement upload..."
  ]);
  const [triggerPulse, setTriggerPulse] = useState(false);
  const [activeTab, setActiveTab] = useState<'PDF' | 'CSV' | 'SMS'>('PDF');
  const [scrubLevel, setScrubLevel] = useState(100);

  const selectPipeline = (source: string, level: number = 100) => {
    if (pipelineStatus === 'INGESTING') return;
    setActivePipeline(source);
    setPipelineStatus('INGESTING');
    setTriggerPulse(true);

    setActiveLogs(prev => {
      const next = [...prev, `[wasm_dec] INGEST: [${source}] payload loaded in local RAM.`];
      if (next.length > 5) next.shift();
      return next;
    });

    setTimeout(() => {
      setActiveLogs(prev => {
        const levelMsg = level === 100 
          ? `[wasm_dec] TOTAL SCRUB: All identifiers (HOLDER, Balances, Card #s, UPI IDs) scrubbed to zero.`
          : level === 50 
            ? `[wasm_dec] SHIELDED MODE: Primary identifiers partially scrubbed. Merchant categories preserved.`
            : `[wasm_dec] WARNING: Minimal scrub activated. Only raw bank signatures redacted.`;
        const next = [...prev, `[wasm_dec] DECODE: running Regex rules...`, levelMsg];
        while (next.length > 5) next.shift();
        return next;
      });
    }, 750);

    setTimeout(() => {
      setActiveLogs(prev => {
        const next = [...prev, `[wasm_dec] SECURED: [${source}] all transaction records scrubbed.`];
        if (next.length > 5) next.shift();
        return next;
      });
      setPipelineStatus('SECURED');
      setTriggerPulse(false);
    }, 1800);
  };

  const getMaskedText = (tab: 'PDF' | 'CSV' | 'SMS', level: number): string => {
    if (tab === 'PDF') {
      if (level === 0) {
        return "ACC: 4892-2901-5521 / BAL: ₹4,18,920.00 / UPI: 882910@ybl / FOOD: SWIGGY-REST";
      }
      if (level <= 50) {
        return "ACC: 4892-2901-**** / BAL: ₹4,18,920.00 / UPI: 882910@ybl / FOOD: MOCKED_FOOD";
      }
      return "ACC: ****-****-**** / BAL: [REDACTED] / UPI: [SCRUBBED] / FOOD: MOCKED_FOOD";
    } else if (tab === 'CSV') {
      if (level === 0) {
        return "TxID: 99201982, Merchant: ZOMATO-FOOD-DELIVERY, Card: 4111-2290-0982-9918, Amt: ₹850";
      }
      if (level <= 50) {
        return "TxID: 99201982, Merchant: ZOMATO-FOOD, Card: ****-****-****-9918, Amt: ₹850";
      }
      return "TxID: [SCRUBBED], Merchant: MOCKED_FOOD, Card: ****-****-****-****, Amt: ₹850";
    } else {
      if (level === 0) {
        return "Debited: ₹649 for Netflix subscription. A/c ending 1928. Ref: UPI/66201";
      }
      if (level <= 50) {
        return "Debited: ₹649 for Netflix subscription. A/c ending ****. Ref: UPI/66201";
      }
      return "Debited: ₹649 for MOCKED_SUB. A/c ending ****. Ref: [REDACTED]";
    }
  };

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '110px', position: 'relative', zIndex: 1, padding: '120px 24px 80px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10%', top: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.14), transparent 70%)', filter: 'blur(110px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', left: '-5%', bottom: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(20,184,166,0.08), transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div className="hero-row" style={{ display: 'flex', alignItems: 'center', gap: '50px', flexWrap: 'wrap', width: '100%' }}>
          
          {/* Left Column: Interactive Ingest Checklist */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '99px', border: `1px solid rgba(99,102,241,0.3)`, background: 'rgba(99,102,241,0.08)', marginBottom: '24px' }}
            >
              <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.indigo, boxShadow: `0 0 8px ${C.indigo}` }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9.5px', fontWeight: 800, color: 'white', letterSpacing: '0.08em' }}>KIRA_ENGINE_V3.0 // ACTIVE</span>
            </motion.div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', margin: '0 0 24px 0', fontFamily: 'Outfit, sans-serif', color: 'white' }}>
              Private Financial <br />
              <span style={{ background: C.gradH, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shiny-anim 6s linear infinite', backgroundSize: '200% auto' }}>Intelligence.</span>
            </h1>

            <p style={{ fontSize: '16.5px', color: C.textMuted, lineHeight: 1.65, margin: '0 0 36px 0', fontFamily: 'Outfit, sans-serif', maxWidth: '560px' }}>
              Kira decodes bank statements locally, scrubs transaction IDs in WebAssembly sandboxes, maps metrics with LangGraph supervisor logic, and routes actionable WhatsApp alerts.
            </p>

            {/* Unique WASM Sandbox Privacy Core Dock */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(5, 5, 14, 0.65)',
              border: `1px solid rgba(20, 184, 166, 0.22)`,
              borderRadius: '24px',
              padding: '22px',
              width: '100%',
              maxWidth: '560px',
              marginBottom: '36px',
              backdropFilter: 'blur(28px)',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(20, 184, 166, 0.04)'
            }}>
              
              {/* Flying particle beam */}
              <AnimatePresence>
                {triggerPulse && (
                  <motion.div
                    initial={{ x: 50, y: 120, opacity: 0, scale: 0.5 }}
                    animate={{ x: [50, 480], y: [120, -50, 60], opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.6] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                    style={{
                      position: 'absolute',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #14b8a6 0%, #6366f1 100%)',
                      boxShadow: '0 0 15px #14b8a6, 0 0 30px #6366f1',
                      zIndex: 999,
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: C.textFaint, fontWeight: 700, letterSpacing: '0.08em' }}>WASM LOCAL SANDBOX // ROUTING BAY</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8.5px', color: pipelineStatus === 'SECURED' ? '#22c55e' : (pipelineStatus === 'INGESTING' ? '#14b8a6' : C.textFaint), fontWeight: 800 }}>
                  STATUS: {pipelineStatus}
                </span>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {(['PDF', 'CSV', 'SMS'] as const).map(tab => {
                  const isActive = activeTab === tab;
                  const colors = { PDF: '#14b8a6', CSV: '#6366f1', SMS: '#ec4899' };
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        if (pipelineStatus === 'INGESTING') return;
                        setActiveTab(tab);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                        border: isActive ? `1px solid ${colors[tab]}40` : '1px solid transparent',
                        color: isActive ? 'white' : 'rgba(200,210,255,0.6)',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: pipelineStatus === 'INGESTING' ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.25s',
                        boxShadow: isActive ? `0 4px 12px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.05)` : 'none'
                      }}
                    >
                      <span>{tab === 'PDF' ? '📄 PDF' : tab === 'CSV' ? '📊 CSV' : '💬 SMS'}</span>
                    </button>
                  );
                })}
              </div>

              {/* File Info Dock */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{activeTab === 'PDF' ? '📄' : activeTab === 'CSV' ? '📊' : '💬'}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                      {activeTab === 'PDF' ? 'statement_q2_raw.pdf' : activeTab === 'CSV' ? 'ledger_export_q2.csv' : 'transaction_sms.txt'}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: C.textFaint }}>
                    {activeTab === 'PDF' ? '142.4 KB' : activeTab === 'CSV' ? '88.1 KB' : '1.2 KB'}
                  </span>
                </div>

                {/* Live Buffer Monitor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {/* Raw Buffer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#f87171', fontWeight: 800 }}>[IN MEMORY RAW BUFFER]</span>
                      <span className="animate-pulse" style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#f87171', fontWeight: 800 }}>EXPOSED</span>
                    </div>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.03)',
                      border: '1px solid rgba(239, 68, 68, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '9.5px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#fca5a5',
                      wordBreak: 'break-all',
                      lineHeight: 1.3
                    }}>
                      {activeTab === 'PDF'
                        ? 'ACC: 4892-2901-5521 / BAL: ₹4,18,920.00 / UPI: 882910@ybl / FOOD: SWIGGY-REST'
                        : activeTab === 'CSV'
                          ? 'TxID: 99201982, Merchant: ZOMATO-FOOD-DELIVERY, Card: 4111-2290-0982-9918, Amt: ₹850'
                          : 'Debited: ₹649 for Netflix subscription. A/c ending 1928. Ref: UPI/66201'
                      }
                    </div>
                  </div>

                  {/* Masked Buffer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#14b8a6', fontWeight: 800 }}>[SCRUBBED LOCAL BUFFER]</span>
                      <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: '#14b8a6', fontWeight: 800 }}>
                        {scrubLevel === 100 ? 'SECURED (100%)' : scrubLevel === 50 ? 'PARTIAL (50%)' : 'MINIMAL'}
                      </span>
                    </div>
                    <div style={{
                      background: 'rgba(20, 184, 166, 0.03)',
                      border: `1px solid rgba(20, 184, 166, 0.15)`,
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '9.5px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#2dd4bf',
                      wordBreak: 'break-all',
                      lineHeight: 1.3,
                      boxShadow: 'inset 0 0 10px rgba(20,184,166,0.02)'
                    }}>
                      {getMaskedText(activeTab, scrubLevel)}
                    </div>
                  </div>
                </div>

                {/* Interactive Redaction Depth Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white' }}>De-identification Depth</span>
                    <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: scrubLevel === 100 ? '#14b8a6' : (scrubLevel === 50 ? '#6366f1' : '#ec4899'), fontWeight: 800 }}>
                      {scrubLevel}% REDACTED
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="50"
                    value={scrubLevel}
                    onChange={(e) => {
                      if (pipelineStatus === 'INGESTING') return;
                      setScrubLevel(Number(e.target.value));
                    }}
                    disabled={pipelineStatus === 'INGESTING'}
                    style={{
                      width: '100%',
                      accentColor: '#14b8a6',
                      height: '4px',
                      borderRadius: '99px',
                      outline: 'none',
                      cursor: pipelineStatus === 'INGESTING' ? 'default' : 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: C.textFaint }}>
                    <span>0% MINIMAL</span>
                    <span>50% SHIELDED</span>
                    <span>100% SECURE</span>
                  </div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <motion.button
                whileHover={{ scale: pipelineStatus === 'INGESTING' ? 1 : 1.02 }}
                whileTap={{ scale: pipelineStatus === 'INGESTING' ? 1 : 0.98 }}
                onClick={() => selectPipeline(activeTab, scrubLevel)}
                disabled={pipelineStatus === 'INGESTING'}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: pipelineStatus === 'INGESTING' ? 'rgba(255,255,255,0.03)' : (pipelineStatus === 'SECURED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(20, 184, 166, 0.12)'),
                  border: pipelineStatus === 'INGESTING' ? '1px solid rgba(255,255,255,0.08)' : (pipelineStatus === 'SECURED' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(20, 184, 166, 0.45)'),
                  color: pipelineStatus === 'SECURED' ? '#4ade80' : '#2dd4bf',
                  fontSize: '12.5px',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  cursor: pipelineStatus === 'INGESTING' ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: pipelineStatus === 'SECURED' ? '0 4px 16px rgba(34, 197, 94, 0.1)' : 'none'
                }}
              >
                <Zap size={14} className={pipelineStatus === 'INGESTING' ? "animate-spin" : ""} />
                {pipelineStatus === 'INGESTING'
                  ? 'COMMITTING CLIENT MASKING...'
                  : (pipelineStatus === 'SECURED' ? 'SECURE FLOW ROUTED ✓' : 'INGEST & RUN DE-IDENTIFICATION')}
              </motion.button>

              {/* Local Telemetry Stats Grid */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                  <span style={{ fontSize: '7px', fontFamily: 'JetBrains Mono, monospace', color: C.textFaint }}>LOCAL_LATENCY</span>
                  <span style={{ fontSize: '10.5px', fontFamily: 'JetBrains Mono, monospace', color: '#14b8a6', fontWeight: 800 }}>&lt; 0.4ms</span>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                  <span style={{ fontSize: '7px', fontFamily: 'JetBrains Mono, monospace', color: C.textFaint }}>RETENTION_TTL</span>
                  <span style={{ fontSize: '10.5px', fontFamily: 'JetBrains Mono, monospace', color: C.pink, fontWeight: 800 }}>0ms // RAM</span>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                  <span style={{ fontSize: '7px', fontFamily: 'JetBrains Mono, monospace', color: C.textFaint }}>ANONYMITY_IDX</span>
                  <span style={{ fontSize: '10.5px', fontFamily: 'JetBrains Mono, monospace', color: '#a7f3d0', fontWeight: 800 }}>
                    {scrubLevel === 100 ? '99.8%' : scrubLevel === 50 ? '78.5%' : '24.1%'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <MagneticButton onClick={onStart}>
                <div style={{ padding: '16px 36px', fontSize: '15px', background: C.grad, borderRadius: '99px', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 30px rgba(99,102,241,0.45)', fontFamily: 'Outfit, sans-serif' }}>
                  Launch Dashboard <ArrowRight size={18} />
                </div>
              </MagneticButton>

              <button
                onClick={() => document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ padding: '16px 34px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px', color: 'white', fontWeight: 700, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                Zero-Knowledge Sandbox <Sparkles size={15} color={C.teal} />
              </button>
            </div>

          </div>

          {/* Right Column: 3D Command Deck Cockpit */}
          <div style={{ flex: '1 1 450px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CommandCenterDeck logs={activeLogs} setLogs={setActiveLogs} status={pipelineStatus} />
          </div>

        </div>
      </div>

      {/* Styles for Hero layout */}
      <style>{`
        .hero-row { display: flex; flex-direction: row; }
        @media(max-width: 991px) {
          .hero-row { flex-direction: column !important; gap: 80px !important; }
          .hero-row > div { width: 100% !important; text-align: center !important; align-items: center !important; }
          .hero-row > div:first-child { align-items: center !important; }
        }
      `}</style>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── ZERO-KNOWLEDGE STATEMENT DE-IDENTIFICATION SANDBOX ──
// ─────────────────────────────────────────────────────────────────────────────
interface TxItem {
  raw: string;
  masked: string;
  category: string;
  amount: string;
  confidence: number;
  icon: React.FC<any>;
  color: string;
  logs: string[];
}

const DecoderSandbox = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayMasked, setDisplayMasked] = useState('');
  const [isMasking, setIsMasking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const transactions: TxItem[] = [
    {
      raw: 'UPI/20260531/SWIGGY-REST-BANGALORE/882901/1420.00/DR',
      masked: 'UPI/20260531/*********_FOOD_DELIVERY/******/******/DR',
      category: 'Food Delivery',
      amount: '₹1,420.00',
      confidence: 98,
      icon: Database,
      color: '#ec4899',
      logs: [
        'Ingesting raw direct UPI string from browser memory...',
        'Running client regex redaction rules (No cloud transmission)',
        'Merchant signature detected: "SWIGGY-REST"',
        'Successfully scrubbed merchant ID and metadata tags.',
        'Token categorized under Food Delivery with 98% confidence.',
      ]
    },
    {
      raw: 'UPI/20260530/UBER-RIDE-HSR-TOWN/129302/380.00/DR',
      masked: 'UPI/20260530/*********_MICRO_TRANSIT/******/******/DR',
      category: 'Micro-Transit',
      amount: '₹380.00',
      confidence: 99,
      icon: Zap,
      color: '#14b8a6',
      logs: [
        'Ingesting raw direct UPI string from browser memory...',
        'Running client regex redaction rules (No cloud transmission)',
        'Merchant signature detected: "UBER-RIDE"',
        'Successfully scrubbed merchant ID and GPS location strings.',
        'Token categorized under Micro-Transit with 99% confidence.',
      ]
    },
    {
      raw: 'UPI/20260529/AMZN-IN-MARKETPLACE/492100/2100.00/DR',
      masked: 'UPI/20260529/*********_RETAIL_SHOPPING/******/******/DR',
      category: 'Shopping',
      amount: '₹2,100.00',
      confidence: 94,
      icon: Shield,
      color: '#6366f1',
      logs: [
        'Ingesting raw direct UPI string from browser memory...',
        'Running client regex redaction rules (No cloud transmission)',
        'Merchant signature detected: "AMZN-IN"',
        'Successfully scrubbed transaction reference parameters.',
        'Token categorized under Retail Shopping with 94% confidence.',
      ]
    },
    {
      raw: 'UPI/20260528/NETFLIX-MEMBER-SUB/330198/649.00/DR',
      masked: 'UPI/20260528/*********_DIGITAL_SERVICES/******/******/DR',
      category: 'Subscriptions',
      amount: '₹649.00',
      confidence: 97,
      icon: Wifi,
      color: '#f59e0b',
      logs: [
        'Ingesting raw direct UPI string from browser memory...',
        'Running client regex redaction rules (No cloud transmission)',
        'Merchant signature detected: "NETFLIX-MEMBER"',
        'Successfully scrubbed subscription index signatures.',
        'Token categorized under Digital Subscriptions with 97% confidence.',
      ]
    }
  ];

  const activeTx = transactions[activeIdx];

  useEffect(() => {
    setIsMasking(true);
    let i = 0;
    const target = activeTx.masked;
    const interval = setInterval(() => {
      setDisplayMasked(() => {
        return target.split('').map((char, index) => {
          if (index < i) return target[index];
          if (char === '/' || char === '-' || char === '_') return char;
          const noise = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$₹%#@!*&';
          return noise[Math.floor(Math.random() * noise.length)];
        }).join('');
      });
      if (i >= target.length) {
        clearInterval(interval);
        setDisplayMasked(target);
        setIsMasking(false);
      }
      i += 2;
    }, 20);
    return () => clearInterval(interval);
  }, [activeIdx]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: '100px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}
      id="simulator"
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap: '50px', flexWrap: 'wrap', width: '100%' }} className="sandbox-row">
        
        {/* LEFT: Explainer & Selectable Items */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10px', fontWeight: 800, color: C.teal, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px', border: `1px solid ${C.teal}40`, padding: '4px 12px', borderRadius: '99px', background: `${C.teal}12` }}>
            Zero-Knowledge Local Sandbox
          </div>
          <h3 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', margin: '0 0 20px 0', fontFamily: 'Outfit, sans-serif', lineHeight: 1.15 }}>
            Client-Side Privacy <span style={{ background: C.gradH, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>De-identification.</span>
          </h3>
          <p style={{ fontSize: '1rem', color: C.textMuted, lineHeight: 1.65, margin: '0 0 32px 0', fontFamily: 'Outfit, sans-serif' }}>
            Kira does not ingest raw merchant transactions. Select any mock UPI entry below to test our local WebAssembly regex de-identification engine. Your private data is completely scrubbed before being analyzed by remote supervisor layers.
          </p>

          {/* List of selectables */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {transactions.map((tx, idx) => {
              const isActive = activeIdx === idx;
              const Icon = tx.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                    border: isActive ? `1px solid ${tx.color}50` : '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isActive ? `0 8px 24px rgba(0,0,0,0.4), 0 0 12px ${tx.color}15` : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: `${tx.color}18`,
                      border: `1px solid ${tx.color}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tx.color,
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: isActive ? 'white' : 'rgba(255,255,255,0.85)', transition: 'color 0.2s' }}>{tx.category}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>Amount: {tx.amount}</span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    color: tx.color,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: `${tx.color}10`,
                  }}>
                    {tx.confidence}% Match
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: High-End Terminal Decoder Engine */}
        <div style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            background: 'rgba(5, 5, 14, 0.75)',
            border: `1px solid ${activeTx.color}35`,
            borderRadius: '24px',
            boxShadow: `0 30px 70px rgba(0,0,0,0.8), 0 0 35px ${activeTx.color}10`,
            padding: '24px',
            fontFamily: 'JetBrains Mono, monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'border-color 0.5s, box-shadow 0.5s',
          }}>
            {/* Header / Window tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={12} color={activeTx.color} />
                <span style={{ fontSize: '9.5px', color: C.textMuted, fontWeight: 700 }}>kira_wasm_dec.rs</span>
              </div>
            </div>

            {/* Raw input block */}
            <div>
              <span style={{ display: 'block', fontSize: '9px', color: '#ff5f56', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 800 }}>[Input Raw UPI payload in RAM]</span>
              <div style={{
                background: 'rgba(255, 95, 86, 0.04)',
                border: '1px solid rgba(255, 95, 86, 0.15)',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '11px',
                color: '#f87171',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                lineHeight: 1.4,
              }}>
                {activeTx.raw}
              </div>
            </div>

            {/* Pipeline logs stream */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ display: 'block', fontSize: '9px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px', fontWeight: 800 }}>[WASM Parser Telemetry]</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.01)', border: `1px solid rgba(255,255,255,0.04)`, borderRadius: '10px', padding: '12px 14px', minHeight: '120px', justifyContent: 'center' }}>
                {activeTx.logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.3 }}
                  >
                    <span style={{ color: activeTx.color }}>&gt;</span>
                    <span>{log}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Secure masked output payload */}
            <div>
              <span style={{ display: 'block', fontSize: '9px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 800 }}>[Secure Masked Payload Dispatched]</span>
              <div style={{
                background: 'rgba(34, 197, 94, 0.04)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '11.5px',
                color: '#4ade80',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                lineHeight: 1.4,
                boxShadow: isMasking ? 'none' : 'inset 0 0 10px rgba(34,197,94,0.05)',
              }}>
                {displayMasked}
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        .sandbox-row { display: flex; flex-direction: row; }
        @media(max-width: 991px) {
          .sandbox-row { flex-direction: column !important; gap: 60px !important; }
        }
      `}</style>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ── NUDGE SIMULATOR & PHONE LOCK SEQUENCE (PRESERVED EXACTLY) ──
// ─────────────────────────────────────────────────────────────────────────────
const NudgePlayground = () => {
  const [activePersona, setActivePersona] = useState<number | null>(0);
  const [logs, setLogs] = useState<string[]>([
    "[ParserNode] Booting local sandbox agent pipeline...",
    "[ParserNode] Ingested raw bank statement table keys.",
    "[ClassifierNode] Discretionary spending anomalies flagged.",
    "[RegressorNode] Calculated daily runway burn trajectory.",
    "[SupervisorNode] Routing audit check for tone compliance...",
    "[SupervisorNode] Sandboxed agent pipeline success."
  ]);
  const [activeStep, setActiveStep] = useState<number | null>(3);
  const [typedNudge, setTypedNudge] = useState("Kira Nudge: Food delivery & transit have eaten 45% of your discretionary cap. Cash forecast indicates zero balance by Oct 14th (12 days early). Action: Freeze Swiggy orders for 3 days to recover ₹2,420.");
  const [simulating, setSimulating] = useState(false);
  const [phoneState, setPhoneState] = useState<'off' | 'lockscreen' | 'homescreen'>('homescreen');

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
  const [activeNode, setActiveNode] = useState<number | null>(null);
  
  // WhatsApp Mock Nudge Simulator states inside bento
  const [selectedNudge, setSelectedNudge] = useState<'food' | 'chai' | 'transit'>('food');
  const [nudgeMessage, setNudgeMessage] = useState("Kira Alert: Food delivery limit breached. Swiggy has taken 40% of your allowance. Freeze Swiggy for 3 days to recover ₹1,820.");

  const handleNudgeSelect = (type: 'food' | 'chai' | 'transit') => {
    setSelectedNudge(type);
    if (type === 'food') {
      setNudgeMessage("Kira Alert: Food delivery limit breached. Swiggy has taken 40% of your allowance. Freeze Swiggy for 3 days to recover ₹1,820.");
    } else if (type === 'chai') {
      setNudgeMessage("Kira Alert: Cafe micro-leakage! Daily Chai visits are projecting a runway exhaustion by June 12th. Switch to office pantry to save ₹680.");
    } else {
      setNudgeMessage("Kira Alert: Rapid transit drain. Daily Uber rides have climbed 15% this week. Action: Take the metro to extend cash runway by 5 days.");
    }
  };

  const cardAnim = (dir: 'left' | 'right' | 'up' | 'scale') => ({
    hidden: dir === 'left' ? { opacity: 0, x: -40 } : dir === 'right' ? { opacity: 0, x: 40 } : dir === 'up' ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.92 },
    show: { opacity: 1, x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 85, damping: 16 } }
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
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Outfit, sans-serif', background: `linear-gradient(90deg,${C.teal},${C.indigo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>financial clarity.</span>
        </motion.h2>
      </div>

      <style>{`
        .feat-grid { display:grid; grid-template-columns:repeat(3,1fr); grid-auto-rows:minmax(280px,auto); gap:24px; }
        .feat-span2 { grid-column:span 2; }
        .interactive-node:hover { transform: scale(1.1); filter: drop-shadow(0 0 10px rgba(20,184,166,0.8)); }
        @media(max-width:1024px){ .feat-grid { grid-template-columns:repeat(2,1fr)!important; } .feat-span2 { grid-column:span 2!important; } }
        @media(max-width:640px){ .feat-grid { grid-template-columns:1fr!important; grid-auto-rows:auto!important; } .feat-span2 { grid-column:span 1!important; } }
      `}</style>

      <div className="feat-grid">
        {/* Card 1: Interactive LangGraph Network (feat-span2) */}
        <motion.div variants={cardAnim('left')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="feat-span2">
          <SpotlightCard glowColor="rgba(20,184,166,0.14)" style={{ background: 'rgba(6,6,20,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(28px)', height: '100%' }}>
            <div style={{ padding: '34px', display: 'flex', gap: '32px', height: '100%', alignItems: 'center', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              {/* Decorative Tech Grid */}
              <div style={{ position: 'absolute', right: '10px', bottom: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '7.5px', color: 'rgba(255,255,255,0.02)', lineHeight: 1.5 }}>
                node_stream_supervisor_network v3.0<br />running classifier on 4 parameters...
              </div>

              <div style={{ flex: 1.2, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `rgba(20,184,166,0.12)`, border: `1px solid rgba(20,184,166,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={18} color={C.teal} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', color: C.teal, fontWeight: 700 }}>SUPERVISOR NETWORK</span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>LangGraph Logic Pipeline</h3>
                <p style={{ color: C.textMuted, fontSize: '14px', margin: 0, lineHeight: 1.68 }}>
                  Kira utilizes a multi-agent logic network. Ingested statements traverse separate regressors that audit models, detect spikes, and verify advice against safety templates automatically.
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                  {['Parser', 'Classifier', 'Regressor', 'Auditor'].map((n, i) => (
                    <React.Fragment key={n}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        background: activeNode === i ? 'rgba(20,184,166,0.18)' : 'rgba(20,184,166,0.06)',
                        border: activeNode === i ? `1px solid ${C.teal}` : `1px solid rgba(20,184,166,0.2)`,
                        fontSize: '9.5px',
                        fontFamily: 'JetBrains Mono, monospace',
                        color: activeNode === i ? 'white' : C.teal,
                        fontWeight: 700,
                        transition: 'all 0.3s'
                      }}>{n}</span>
                      {i < 3 && <span style={{ width: '12px', height: '1.5px', background: activeNode === i ? C.teal : 'rgba(255,255,255,0.06)' }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Interactive Vector Pipeline Graph */}
              <div style={{ width: '180px', height: '160px', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="100%" viewBox="0 0 180 160" style={{ overflow: 'visible' }}>
                  {/* Connecting lines */}
                  {[[25,80,90,35],[25,80,90,125],[90,35,155,80],[90,125,155,80]].map(([x1,y1,x2,y2], i) => (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                      <motion.line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={activeNode === i || activeNode === i + 1 ? C.teal : 'rgba(20,184,166,0.25)'}
                        strokeWidth="1.8"
                        strokeDasharray="5,5"
                        animate={{ strokeDashoffset: [0, -20] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      />
                    </g>
                  ))}
                  
                  {/* Nodes */}
                  {[
                    { x: 25, y: 80, label: 'Parser', desc: 'Converts bank tables' },
                    { x: 90, y: 35, label: 'Classifier', desc: 'Identifies merchant caps' },
                    { x: 90, y: 125, label: 'Regressor', desc: 'Predicts day zero runway' },
                    { x: 155, y: 80, label: 'Auditor', desc: 'Audits privacy compliance' }
                  ].map((node, i) => (
                    <g
                      key={i}
                      onMouseEnter={() => setActiveNode(i)}
                      onMouseLeave={() => setActiveNode(null)}
                      style={{ cursor: 'pointer' }}
                      className="interactive-node"
                    >
                      <circle cx={node.x} cy={node.y} r="18" fill="#03030c" stroke={activeNode === i ? C.teal : 'rgba(255,255,255,0.1)'} strokeWidth="2" />
                      <circle cx={node.x} cy={node.y} r="4" fill={activeNode === i ? C.teal : 'rgba(255,255,255,0.2)'} />
                      <text x={node.x} y={node.y - 24} textAnchor="middle" fontSize="8" fill={activeNode === i ? 'white' : 'rgba(255,255,255,0.45)'} fontFamily="JetBrains Mono" fontWeight="bold">{node.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 2: Statement Parser with live parsing ticker */}
        <motion.div variants={cardAnim('scale')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} onMouseEnter={() => setParserHov(true)} onMouseLeave={() => setParserHov(false)}>
          <SpotlightCard glowColor="rgba(99,102,241,0.14)" style={{ background: 'rgba(6,6,20,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(28px)', height: '100%' }}>
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(99,102,241,0.12)', border: `1px solid rgba(99,102,241,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={16} color={C.indigo} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.indigo, fontWeight: 700 }}>PARSER CORE</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: parserHov ? '#22c55e' : C.textFaint, fontWeight: 700, transition: 'color 0.3s' }}>{parserHov ? 'COMPILING...' : 'STANDBY'}</span>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Statement Parser</h3>
              <p style={{ color: C.textMuted, fontSize: '13.5px', margin: 0, lineHeight: 1.6, flexGrow: 1 }}>
                Ingests statements securely and extracts raw parameters into mapped datasets locally.
              </p>

              {/* Live terminal simulation ticker */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                color: parserHov ? '#4ade80' : 'rgba(255,255,255,0.3)',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                transition: 'color 0.3s'
              }}>
                {parserHov ? (
                  <>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>&gt; PARSING swiggy_stmt.csv</motion.span>
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.1 }}>&gt; SUCCESS: 14 rows structured</motion.span>
                  </>
                ) : (
                  <>
                    <span>&gt; awaiting upload stream</span>
                    <span>&gt; session isolated</span>
                  </>
                )}
              </div>

              {/* Animated parse progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>
                  <span>Parse rate</span>
                  <span style={{ color: parserHov ? '#22c55e' : C.textFaint }}>{parserHov ? '99.7%' : '0%'}</span>
                </div>
                <AnimatedProgressBar value={parserHov ? 99.7 : 0} color={C.indigo} />
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 3: WhatsApp Interactive Nudge Click-Simulator (feat-span2) */}
        <motion.div variants={cardAnim('up')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="feat-span2">
          <SpotlightCard glowColor="rgba(236,72,153,0.14)" style={{ background: 'rgba(6,6,20,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(28px)', height: '100%' }}>
            <div style={{ padding: '34px', display: 'flex', gap: '32px', height: '100%', alignItems: 'center', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              
              <div style={{ flex: 1.1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236,72,153,0.1)', border: `1px solid rgba(236,72,153,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={18} color={C.pink} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', color: C.pink, fontWeight: 700 }}>BEHAVIORAL ROUTER</span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>WhatsApp Budget Nudges</h3>
                <p style={{ color: C.textMuted, fontSize: '14px', margin: 0, lineHeight: 1.68 }}>
                  No complex dashboards to check. Kira dispatches custom coaching nudges that highlight discretionary leaks directly on your lockscreen. Click tabs to test different triggers below:
                </p>
                
                {/* Simulator Triggers */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {[
                    { type: 'food', label: '🍔 Swiggy Loop', color: C.pink },
                    { type: 'chai', label: '☕ Cafe Leak', color: C.teal },
                    { type: 'transit', label: '🚗 Uber Surge', color: '#f59e0b' }
                  ].map(tab => (
                    <button
                      key={tab.type}
                      onClick={() => handleNudgeSelect(tab.type as any)}
                      style={{
                        padding: '6px 14px',
                        background: selectedNudge === tab.type ? 'white' : 'rgba(255,255,255,0.03)',
                        border: selectedNudge === tab.type ? `1px solid ${tab.color}` : `1px solid rgba(255,255,255,0.08)`,
                        borderRadius: '99px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: selectedNudge === tab.type ? 'black' : 'rgba(255,255,255,0.65)',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Fidelity WhatsApp Phone Message Simulation */}
              <div style={{ width: '220px', height: '170px', flexShrink: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#0b141a',
                  border: '4px solid #2d2d30',
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* WhatsApp Header banner */}
                  <div style={{ background: '#075e54', padding: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px' }}>💬</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'white', fontFamily: 'Outfit, sans-serif' }}>Kira Budget Coach</span>
                      <span style={{ fontSize: '7px', color: '#25d366', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>online</span>
                    </div>
                  </div>
                  
                  {/* Message Bubble area */}
                  <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'radial-gradient(circle, rgba(7,94,84,0.05), transparent 75%)' }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedNudge}
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ type: 'spring', damping: 15 }}
                        style={{
                          background: '#056162',
                          borderRadius: '0px 14px 14px 14px',
                          padding: '8px 12px',
                          color: 'white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '9.5px', fontFamily: 'Outfit, sans-serif', lineHeight: 1.4 }}>
                          {nudgeMessage}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                          <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>12:44 PM</span>
                          <span style={{ color: '#34b7f1', fontSize: '7px' }}>✓✓</span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Card 4: Circuit Breaker with high-fidelity security safe toggle */}
        <motion.div variants={cardAnim('right')} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <SpotlightCard glowColor="rgba(20,184,166,0.12)" style={{ background: 'rgba(6,6,20,0.65)', border: `1px solid ${C.border}`, backdropFilter: 'blur(28px)', height: '100%' }}>
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
              <p style={{ color: C.textMuted, fontSize: '13.5px', margin: 0, lineHeight: 1.6, flexGrow: 1 }}>
                Volatile sandbox storage ensures bank details scrub merchant records regex-scrubbed before hitting remote streams.
              </p>

              {/* Secure switch widget */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${C.border}`,
                padding: '12px 18px',
                borderRadius: '16px',
                boxShadow: toggleActive ? 'inset 0 0 10px rgba(34,197,94,0.06)' : 'none'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: toggleActive ? '#4ade80' : C.textFaint,
                    fontWeight: 800,
                    textShadow: toggleActive ? '0 0 8px rgba(74,222,128,0.3)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    {toggleActive ? 'VAULT SECURED' : 'UNSECURED'}
                  </span>
                  <span style={{ fontSize: '7.5px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>
                    Regex Purge Active
                  </span>
                </div>
                <button
                  onClick={() => setToggleActive(!toggleActive)}
                  style={{
                    width: '42px',
                    height: '22px',
                    borderRadius: '99px',
                    background: toggleActive ? '#22c55e' : 'rgba(255,255,255,0.08)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '2px',
                    transition: 'background 0.3s',
                    boxShadow: toggleActive ? '0 0 12px rgba(34,197,94,0.4)' : 'none'
                  }}
                >
                  <motion.div
                    layout
                    style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', left: toggleActive ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
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
// ─────────────────────────────────────────────────────────────────────────────
// ── HOW IT WORKS – SLEEK DIGG-STYLE ARCHITECTURAL SOCIAL FEED ──
// ─────────────────────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const [votes, setVotes] = useState<Record<number, number>>({
    0: 942,
    1: 818,
    2: 605,
    3: 411
  });
  const [upvoted, setUpvoted] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false
  });
  const [expandedLogIdx, setExpandedLogIdx] = useState<number | null>(0);

  const toggleUpvote = (id: number) => {
    setUpvoted(prev => {
      const isUp = !!prev[id];
      setVotes(v => ({
        ...v,
        [id]: isUp ? v[id] - 1 : v[id] + 1
      }));
      return { ...prev, [id]: !isUp };
    });
  };

  const steps = [
    {
      id: 0,
      channel: 'local-privacy-core',
      author: 'wasm_sandbox_agent',
      time: '5m ago',
      title: 'WASM local parser strips PII in browser sandbox before dispatch',
      desc: 'Raw bank statements never touch Kira-AI servers unencrypted. Our Regex de-identification core executes client-side inside volatile browser memory, completely scrubbing names, account numbers, and transaction IDs.',
      tags: ['#wasm', '#regex-masking', '#client-privacy'],
      color: C.indigo,
      comments: 42,
      cmd: 'KIRA_INGEST: parsed 128 rows. Scrubbed merchant UPI parameters. Dispatching anonymous vector payload.'
    },
    {
      id: 1,
      channel: 'langgraph-coordinator',
      author: 'graph_supervisor',
      time: '12m ago',
      title: 'LangGraph supervisor agent coordinates runway drain regressions',
      desc: 'An intelligent coordinator agent charts day-zero runway parameters, spawning expert sub-agents to trace food/ride subscription loops, verify spike anomalies, and construct tone-compliant budget recovery warnings.',
      tags: ['#langgraph', '#supervisors', '#regressions'],
      color: C.pink,
      comments: 29,
      cmd: 'KIRA_FORECAST: calculated daily burn baseline. Weekend food spike flagged. Spawning sub-agent auditors.'
    },
    {
      id: 2,
      channel: 'whatsapp-alert-bridge',
      author: 'twilio_bridge_dispatcher',
      time: '28m ago',
      title: 'Real-time SMS & WhatsApp alerts push actionable lockscreen budget warnings',
      desc: 'Kira-AI syncs securely with communications bridges to push instant, actionable WhatsApp reminders to your mobile phone. Budget warnings come with custom 1-click reward acceptance feedback tags.',
      tags: ['#whatsapp', '#user-nudges', '#feedback-loop'],
      color: C.teal,
      comments: 18,
      cmd: 'KIRA_DISPATCH: Alert payload constructed. Transmitting secure WhatsApp lockscreen nudge. Awaiting reward callback.'
    },
    {
      id: 3,
      channel: 'gitlab-issue-hardener',
      author: 'repo_ticket_auditor',
      time: '45m ago',
      title: 'GitLab ticket auto-logging enables advanced programmatic team hardening',
      desc: 'For power users and dev teams, critical cash runway alerts can be logged programmatically as structured GitLab issues, automatically mapping financial anomalies to code logs for continuous team auditing.',
      tags: ['#gitlab-api', '#system-audits', '#team-hardening'],
      color: '#f59e0b',
      comments: 12,
      cmd: 'KIRA_AUDIT: Critical burn logged to GitLab API. Ticket #889 opened. Pipeline checklist audit passed.'
    }
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.9 }}
      id="howitworks"
      style={{ padding: '120px 24px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}
    >
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '72px' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ fontFamily: 'Outfit, sans-serif', fontSize: '10.5px', fontWeight: 700, color: C.pink, textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(236,72,153,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(236,72,153,0.07)', display: 'inline-block', marginBottom: '16px' }}>Pipeline Architecture</motion.div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: 0 }}>
          Engineering{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Outfit, sans-serif', color: C.pink }}>Chronicles.</span>
        </h2>
        <p style={{ fontSize: '15px', color: C.textMuted, marginTop: '12px', fontFamily: 'Outfit, sans-serif' }}>
          Explore our system architecture styled as a premium interactive news feed. Upvote or expand telemetry logs on any component.
        </p>
      </div>

      {/* Feed list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {steps.map((step) => {
          const isUp = !!upvoted[step.id];
          const score = votes[step.id];
          const isExpanded = expandedLogIdx === step.id;

          return (
            <motion.div
              key={step.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'rgba(5, 5, 14, 0.72)',
                border: isUp ? `1px solid ${step.color}60` : `1px solid ${C.border}`,
                borderRadius: '24px',
                padding: '24px',
                display: 'flex',
                gap: '20px',
                boxShadow: isUp ? `0 15px 35px rgba(0,0,0,0.6), 0 0 20px ${step.color}15` : '0 10px 30px rgba(0,0,0,0.4)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                alignItems: 'flex-start'
              }}
            >
              {/* Upvote column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <motion.button
                  onClick={() => toggleUpvote(step.id)}
                  whileTap={{ scale: 0.85 }}
                  style={{
                    background: isUp ? step.color : 'rgba(255,255,255,0.03)',
                    border: isUp ? 'none' : `1px solid rgba(255,255,255,0.08)`,
                    color: isUp ? 'black' : 'rgba(255,255,255,0.6)',
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: isUp ? `0 0 12px ${step.color}` : 'none'
                  }}
                  onMouseEnter={e => { if (!isUp) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => { if (!isUp) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </motion.button>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: isUp ? step.color : 'white', transition: 'color 0.2s' }}>
                  {score}
                </span>
              </div>

              {/* Main content column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Meta details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: step.color, fontWeight: 700 }}>in/{step.channel}</span>
                  <span>•</span>
                  <span>Posted by u/{step.author}</span>
                  <span>•</span>
                  <span>{step.time}</span>
                </div>

                {/* Title */}
                <h4
                  onClick={() => toggleUpvote(step.id)}
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'white',
                    margin: 0,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer',
                    lineHeight: 1.35
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = step.color}
                  onMouseLeave={e => e.currentTarget.style.color = 'white'}
                >
                  {step.title}
                </h4>

                {/* Description */}
                <p style={{ fontSize: '13.5px', color: C.textMuted, margin: '4px 0 10px 0', lineHeight: 1.58, fontFamily: 'Outfit, sans-serif' }}>
                  {step.desc}
                </p>

                {/* Tags and expandable logs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Hashtags list */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {step.tags.map((tag) => (
                      <span key={tag} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', border: `1px solid rgba(255,255,255,0.05)` }}>{tag}</span>
                    ))}
                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontFamily: 'Outfit, sans-serif', color: C.textMuted }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = step.color} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                      <span>💬</span> {step.comments} Comments
                    </span>
                    <button
                      onClick={() => setExpandedLogIdx(isExpanded ? null : step.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isExpanded ? step.color : C.textMuted,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: isExpanded ? 700 : 400,
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.color = step.color; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.color = C.textMuted; }}
                    >
                      <span>⚙</span> Telemetry Logs {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Telemetry log expand block */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: 'hidden', marginTop: '14px' }}
                    >
                      <div style={{
                        background: '#04040c',
                        border: `1px solid ${step.color}35`,
                        borderRadius: '16px',
                        padding: '16px 20px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: step.color,
                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.85)',
                        lineHeight: 1.4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: step.color, boxShadow: `0 0 8px ${step.color}` }} className="animate-pulse" />
                          <span style={{ color: C.textFaint, fontSize: '9px', textTransform: 'uppercase' }}>Console Log Output</span>
                        </div>
                        &gt; {step.cmd}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
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
      <DecoderSandbox />
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
