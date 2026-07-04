import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { C } from '../DesignTokens';
import { MagneticButton } from '../primitives/MagneticButton';

const useCountUp = (end: number, duration = 1.8, decimals = 0) => {
  const [val, setVal] = React.useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  React.useEffect(() => {
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

export const PricingSection: React.FC<{ onStart?: () => void }> = ({ onStart }) => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const stat1 = useCountUp(40000, 2.2, 0);
  const stat2 = useCountUp(99.8, 1.8, 1);
  const stat3 = useCountUp(1200, 1.8, 0);
  const stat4 = useCountUp(3, 2, 0);

  const plans = [
    {
      name: 'Solo',
      badge: '',
      price: { monthly: 0, annual: 0 },
      desc: 'For devs, freelancers & individual users wanting complete privacy.',
      features: ['1 linked bank account', 'WASM privacy sandbox', 'LangGraph pipeline (3 nodes)', 'WhatsApp nudge alerts', 'Local CSV/PDF parser', '7-day analytics retention'],
      cta: 'Start Free',
      color: C.indigo,
    },
    {
      name: 'Shield',
      badge: 'MOST POPULAR',
      price: { monthly: 499, annual: 399 },
      desc: 'Full stack. Real-time. Unlimited de-identification passes.',
      features: ['Unlimited bank accounts', 'All Solo features included', 'Multi-source ingestion (PDF/CSV/SMS)', 'GitLab audit ticket auto-logger', 'Priority Twilio bridge dispatching', 'Custom Regex scrubbing rules', 'Coach feedback loop training'],
      cta: 'Start Shield',
      color: C.pink,
      popular: true,
    },
    {
      name: 'Enterprise',
      badge: 'CUSTOM',
      price: { monthly: null, annual: null },
      desc: 'Dedicated infrastructure for fintech teams, compliance-first deployments.',
      features: ['Unlimited team members', 'On-prem WASM vault hosting', 'Custom LangGraph flow authoring', 'SLA-backed uptime guarantee', 'SSO + RBAC team controls', 'SOC-2 compliance packaging', 'Dedicated success engineer'],
      cta: 'Contact Sales',
      color: C.teal,
    },
  ];

  return (
    <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.9 }} id="pricing" style={{ padding: '120px 24px 60px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

      {/* Stats Row */}
      <div ref={stat1.ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', marginBottom: '80px' }}>
        {[
          { val: stat1.val.toLocaleString() + '+', label: 'Bank Rows Parsed', color: C.indigo },
          { val: stat2.val + '%', label: 'Privacy Uptime', color: C.teal },
          { val: '₹' + stat3.val.toLocaleString() + '+', label: 'Avg. Monthly Savings', color: C.pink },
          { val: stat4.val + ' sec', label: 'Avg. Parse Time', color: '#f59e0b' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: s.color, letterSpacing: '-1.5px' }}>{s.val}</div>
            <div style={{ fontSize: '12.5px', color: C.textMuted, fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '2px', border: `1px solid rgba(245,158,11,0.3)`, padding: '4px 14px', borderRadius: '99px', background: 'rgba(245,158,11,0.07)', display: 'inline-block', marginBottom: '16px' }}>Transparent Pricing</div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-1.5px', margin: '0 0 20px 0' }}>
          Choose your{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontFamily: 'Instrument Serif, serif', color: '#f59e0b' }}>privacy stack.</span>
        </h2>
        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <span style={{ fontSize: '13px', color: billing === 'monthly' ? 'white' : C.textMuted, fontFamily: 'Outfit, sans-serif', fontWeight: billing === 'monthly' ? 700 : 400, transition: 'color 0.2s' }}>Monthly</span>
          <button onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')} style={{ width: '44px', height: '24px', borderRadius: '99px', background: billing === 'annual' ? C.indigo : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', boxShadow: billing === 'annual' ? `0 0 12px ${C.indigo}66` : 'none' }}>
            <motion.div layout style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: billing === 'annual' ? '23px' : '3px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
          </button>
          <span style={{ fontSize: '13px', color: billing === 'annual' ? 'white' : C.textMuted, fontFamily: 'Outfit, sans-serif', fontWeight: billing === 'annual' ? 700 : 400, transition: 'color 0.2s' }}>Annual</span>
          <AnimatePresence>
            {billing === 'annual' && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} style={{ fontSize: '11px', background: 'rgba(99,102,241,0.12)', border: `1px solid rgba(99,102,241,0.3)`, color: C.indigo, padding: '2px 10px', borderRadius: '99px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Save 20%</motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pricing Cards */}
      <style>{`.pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; } @media(max-width:960px){ .pricing-grid { grid-template-columns:1fr!important; } }`}</style>
      <div className="pricing-grid">
        {plans.map((plan, idx) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.12, duration: 0.7 }} onMouseEnter={() => setHighlighted(idx)} onMouseLeave={() => setHighlighted(null)} style={{ background: plan.popular ? `${plan.color}0a` : 'rgba(6,6,20,0.7)', border: plan.popular ? `1px solid ${plan.color}` : highlighted === idx ? `1px solid ${plan.color}44` : `1px solid ${C.border}`, borderRadius: '24px', padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', backdropFilter: 'blur(20px)', boxShadow: plan.popular ? `0 0 40px ${plan.color}15, 0 20px 50px rgba(0,0,0,0.4)` : highlighted === idx ? `0 16px 40px rgba(0,0,0,0.4)` : 'none', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
            {plan.badge && (
              <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', background: plan.color, color: plan.popular ? 'white' : 'black', padding: '3px 16px', borderRadius: '99px', fontSize: '10px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', boxShadow: `0 0 14px ${plan.color}66` }}>{plan.badge}</div>
            )}
            <div>
              <h3 style={{ fontSize: '21px', fontWeight: 800, color: 'white', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif' }}>{plan.name}</h3>
              <div style={{ fontSize: plan.price.monthly !== null ? 'clamp(2rem,3.5vw,2.8rem)' : '22px', fontWeight: 900, color: plan.color, letterSpacing: '-1px', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                {plan.price.monthly !== null ? (
                  <AnimatePresence mode="wait">
                    <motion.span key={billing} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'inline-block' }}>
                      {plan.price.monthly === 0 ? 'Free' : `₹${billing === 'annual' ? plan.price.annual : plan.price.monthly}`}
                    </motion.span>
                  </AnimatePresence>
                ) : 'Custom'}
              </div>
              {plan.price.monthly !== null && plan.price.monthly > 0 && <div style={{ fontSize: '12px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>/month per user</div>}
              <p style={{ color: C.textMuted, fontSize: '13.5px', margin: '12px 0 0 0', lineHeight: 1.55, fontFamily: 'Outfit, sans-serif' }}>{plan.desc}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: `${plan.color}18`, border: `1px solid ${plan.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} color={plan.color} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit, sans-serif' }}>{f}</span>
                </div>
              ))}
            </div>
            <MagneticButton onClick={plan.cta === 'Start Free' || plan.cta === 'Start Shield' ? onStart : undefined}>
              <div style={{ width: '100%', padding: '14px 0', borderRadius: '14px', background: plan.popular ? plan.color : `${plan.color}18`, border: plan.popular ? 'none' : `1px solid ${plan.color}44`, color: plan.popular ? 'white' : plan.color, fontSize: '15px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: plan.popular ? `0 8px 24px ${plan.color}44` : 'none' }}>
                {plan.cta} <ArrowRight size={16} />
              </div>
            </MagneticButton>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
