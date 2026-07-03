/**
 * LandingScreen.tsx
 * ─────────────────
 * Orchestrator component for the public marketing page.
 * Each visual section lives in its own file under landing/sections/.
 * Global styles (animations, keyframes, resets) are the only inline content.
 */
import React from 'react';
import { useScroll } from 'framer-motion';

// Layout & background
import { BackgroundEffects } from './landing/BackgroundEffects';
import { NavBar } from './landing/NavBar';

// Page sections
import { HeroSection }      from './landing/sections/HeroSection';
import { FeaturesGrid }     from './landing/sections/FeaturesGrid';
import { DecoderSandbox }   from './landing/sections/DecoderSandbox';
import { NudgePlayground }  from './landing/sections/NudgePlayground';
import { HowItWorks }       from './landing/sections/HowItWorks';
import { SecuritySection }  from './landing/sections/SecuritySection';
import { PricingSection }   from './landing/sections/PricingSection';
import { FooterSection }    from './landing/sections/FooterSection';

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL KEYFRAMES & UTILITY STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; padding: 0; overflow-x: hidden; }

  @keyframes kira-drift   { from { transform: translate(0, 0) scale(1); } to { transform: translate(2%, 3%) scale(1.06); } }
  @keyframes shiny-anim   { to { background-position: 200% center; } }
  @keyframes float-gentle { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }

  .animate-pulse  { animation: kira-pulse 1.8s ease-in-out infinite; }
  .animate-spin   { animation: kira-spin 1s linear infinite; }

  @keyframes kira-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes kira-spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* Scrollbar */
  ::-webkit-scrollbar              { width: 6px; }
  ::-webkit-scrollbar-track        { background: transparent; }
  ::-webkit-scrollbar-thumb        { background: rgba(99,102,241,0.35); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover  { background: rgba(99,102,241,0.55); }

  /* Desktop/Mobile responsive helpers */
  @media (max-width: 768px) {
    .desktop-only { display: none !important; }
    .mobile-hamburger-btn { display: flex !important; }
  }
  @media (min-width: 769px) {
    .mobile-hamburger-btn { display: none !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// LANDING SCREEN
// ─────────────────────────────────────────────────────────────────────────────
interface LandingScreenProps {
  onStart?: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  const { scrollYProgress } = useScroll();

  return (
    <div style={{ minHeight: '100vh', background: '#03030c', color: '#f0f4ff', fontFamily: 'Outfit, sans-serif', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {/* ── Fixed Background Layer ────────────────────────────────── */}
      <BackgroundEffects scrollYProgress={scrollYProgress} />

      {/* ── Navigation ───────────────────────────────────────────── */}
      <NavBar onStart={onStart} />

      {/* ── Page Content ─────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection    onStart={onStart} />
        <FeaturesGrid   />
        <DecoderSandbox />
        <NudgePlayground />
        <HowItWorks     />
        <SecuritySection />
        <PricingSection  onStart={onStart} />
        <FooterSection   onStart={onStart} />
      </main>
    </div>
  );
};

export default LandingScreen;
