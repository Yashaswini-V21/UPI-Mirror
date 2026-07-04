import React from 'react';
import { motion } from 'framer-motion';
import { C } from '../DesignTokens';
import { MagneticButton } from '../primitives/MagneticButton';

export const FooterSection: React.FC<{ onStart?: () => void }> = ({ onStart }) => {
  return (
    <footer style={{ position: 'relative', zIndex: 1, padding: '80px 24px 40px', borderTop: `1px solid ${C.border}`, maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '64px' }}>
        {/* Brand */}
        <div style={{ minWidth: '240px', flex: '1 1 240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', color: 'white', boxShadow: `0 0 14px rgba(99,102,241,0.6)` }}>K</div>
            <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(90deg,#f0f4ff,rgba(200,210,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Kira-AI</span>
          </div>
          <p style={{ fontSize: '13.5px', color: C.textMuted, lineHeight: 1.65, maxWidth: '260px', fontFamily: 'Outfit, sans-serif', margin: '0 0 20px 0' }}>
            Private financial intelligence. Zero data retention. Built for India's financial ecosystem.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(20,184,166,0.06)', border: `1px solid rgba(20,184,166,0.22)`, borderRadius: '12px', padding: '10px 14px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} className="animate-pulse" />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#22c55e', fontWeight: 700 }}>ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        {/* Link columns */}
        {[
          { title: 'Product', links: ['Features', 'Security', 'Pricing', 'Changelog', 'Roadmap'] },
          { title: 'Developers', links: ['API Docs', 'GitHub', 'Discord', 'LangGraph Flows', 'Privacy SDK'] },
          { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press Kit', 'Privacy Policy'] },
        ].map(col => (
          <div key={col.title} style={{ minWidth: '130px', flex: '0 0 auto' }}>
            <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '12.5px', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px 0' }}>{col.title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {col.links.map(link => (
                <a key={link} href="#" onClick={e => e.preventDefault()} style={{ fontSize: '13.5px', color: C.textMuted, textDecoration: 'none', fontFamily: 'Outfit, sans-serif', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'white')} onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}>{link}</a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ background: 'rgba(99,102,241,0.06)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: '24px', padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', marginBottom: '40px', backdropFilter: 'blur(24px)' }}>
        <div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '22px', color: 'white', margin: '0 0 6px 0' }}>Start protecting your finances — today.</h3>
          <p style={{ color: C.textMuted, fontSize: '14px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>No credit card needed. 100% client-side. Private by architecture.</p>
        </div>
        <MagneticButton onClick={onStart}>
          <div style={{ padding: '14px 30px', background: C.grad, borderRadius: '99px', color: 'white', fontSize: '15px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Launch Kira Free →
          </div>
        </MagneticButton>
      </motion.div>

      {/* Bottom bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '24px', borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.textFaint }}>© 2026 Kira-AI. Built with ❤ for Indian fintech privacy.</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: C.textFaint }}>KIRA_ENGINE v3.0.0 · WASM Sandbox · LangGraph v0.2.x</span>
      </div>
    </footer>
  );
};
