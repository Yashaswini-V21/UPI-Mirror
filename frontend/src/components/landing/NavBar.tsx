/**
 * landing/NavBar.tsx
 * ───────────────────
 * Floating capsule navbar with active section detection, mobile drawer,
 * and launch button.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { C } from './DesignTokens';

const NAV_ITEMS = ['Features', 'Simulator', 'How it Works', 'Security', 'Pricing'] as const;

interface NavBarProps {
  onStart?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({ onStart }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map((i) => i.toLowerCase().replace(/\s+/g, ''));
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'fixed', top: '18px', left: '20px', right: '20px', zIndex: 9999, display: 'flex', justifyContent: 'center' }}
      >
        <nav
          style={{
            width: '100%',
            maxWidth: scrolled ? '800px' : '1060px',
            background: 'rgba(3,3,12,0.75)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: scrolled ? `1px solid ${C.borderGlow}` : `1px solid ${C.border}`,
            borderRadius: '99px',
            padding: scrolled ? '10px 22px' : '13px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: scrolled
              ? '0 14px 44px rgba(0,0,0,0.7),0 0 24px rgba(99,102,241,0.14)'
              : '0 8px 32px rgba(0,0,0,0.35)',
            transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            role="button"
            tabIndex={0}
            aria-label="Go to top"
            onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.7 }}
              style={{ width: '30px', height: '30px', borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', color: 'white', boxShadow: '0 0 14px rgba(99,102,241,0.6)' }}
            >
              K
            </motion.div>
            <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(90deg,#f0f4ff,rgba(200,210,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Kira-AI
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
            {NAV_ITEMS.map((item) => {
              const id = item.toLowerCase().replace(/\s+/g, '');
              const isActive = (hovered || active) === id;
              return (
                <a
                  key={item}
                  href={`#${id}`}
                  onMouseEnter={() => setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(e) => { e.preventDefault(); scrollTo(id); }}
                  aria-current={active === id ? 'true' : undefined}
                  style={{ color: isActive ? 'white' : 'rgba(200,210,255,0.6)', textDecoration: 'none', fontSize: '13px', fontWeight: 600, padding: '7px 15px', borderRadius: '99px', position: 'relative', transition: 'color 0.25s', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      style={{ position: 'absolute', inset: 0, borderRadius: '99px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)' }}
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    />
                  )}
                  {active === id && (
                    <motion.span
                      layoutId="nav-dot"
                      style={{ width: '4px', height: '4px', borderRadius: '50%', background: C.indigo, boxShadow: `0 0 6px ${C.indigo}`, flexShrink: 0 }}
                    />
                  )}
                  <span style={{ position: 'relative' }}>{item}</span>
                </a>
              );
            })}
          </div>

          {/* Right: version + CTA + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="desktop-only" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: `${C.teal}cc`, letterSpacing: '0.06em' }}>
              v3.0.0
            </span>
            <motion.button
              onClick={onStart}
              aria-label="Launch App"
              whileHover={{ scale: 1.06, boxShadow: '0 6px 22px rgba(99,102,241,0.45)' }}
              whileTap={{ scale: 0.95 }}
              style={{ borderRadius: '99px', padding: '8px 20px', fontSize: '13px', background: C.grad, border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
            >
              Launch App
            </motion.button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="mobile-hamburger-btn"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </nav>
      </motion.div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-label="Mobile navigation"
            style={{ position: 'fixed', top: '88px', left: '20px', right: '20px', background: 'rgba(6,6,18,0.97)', backdropFilter: 'blur(28px)', border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 9998, boxShadow: '0 24px 60px rgba(0,0,0,0.85)' }}
          >
            {NAV_ITEMS.map((item) => {
              const id = item.toLowerCase().replace(/\s+/g, '');
              return (
                <a
                  key={item}
                  href={`#${id}`}
                  onClick={(e) => { e.preventDefault(); setMobileOpen(false); scrollTo(id); }}
                  style={{ color: 'rgba(200,210,255,0.85)', textDecoration: 'none', fontSize: '15px', fontWeight: 600, padding: '10px 0', borderBottom: `1px solid ${C.border}`, fontFamily: 'Outfit, sans-serif' }}
                >
                  {item}
                </a>
              );
            })}
            <button
              onClick={() => { setMobileOpen(false); onStart?.(); }}
              style={{ background: C.grad, color: 'white', border: 'none', padding: '14px', borderRadius: '99px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '8px', fontFamily: 'Outfit, sans-serif' }}
            >
              Launch Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
