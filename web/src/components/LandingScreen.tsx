import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { KiraButton, StatusBadge, GlassCard } from './ui';

const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number, y: number, vx: number, vy: number, color: string, radius: number }[] = [];
    const colors = ['#9d7aff', '#3b82f6', '#22c55e'];
    for(let i=0; i<150; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() * 1.5 + 0.5
      });
    }

    const shootingStars: { x: number, y: number, vx: number, vy: number, life: number, maxLife: number }[] = [];
    let lastShootingStar = 0;
    
    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if(p.x < 0) p.x = width;
        if(p.x > width) p.x = 0;
        if(p.y < 0) p.y = height;
        if(p.y > height) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      for(let i=0; i<particles.length; i++) {
        for(let j=i+1; j<particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx*dx + dy*dy;
          if(distSq < 120 * 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255, ${0.1 - (distSq / (120*120)) * 0.1})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      if (time - lastShootingStar > 4000 + Math.random() * 2000) {
        shootingStars.push({
          x: Math.random() * width,
          y: 0,
          vx: 4 + Math.random() * 4,
          vy: 4 + Math.random() * 4,
          life: 0,
          maxLife: 100
        });
        lastShootingStar = time;
      }
      
      for(let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life++;
        
        const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx*10, ss.y - ss.vy*10);
        grad.addColorStop(0, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx*10, ss.y - ss.vy*10);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render(performance.now());
    
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

const BackgroundEffects = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    <Starfield />
    
    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, #a855f7, transparent 70%)', filter: 'blur(80px)', opacity: 0.15, animation: 'kira-drift 20s infinite alternate ease-in-out' }} />
    <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, #22c55e, transparent 70%)', filter: 'blur(80px)', opacity: 0.12, animation: 'kira-drift 15s infinite alternate-reverse ease-in-out' }} />
    <div style={{ position: 'absolute', top: '30%', left: '30%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, #3b82f6, transparent 70%)', filter: 'blur(80px)', opacity: 0.18, animation: 'kira-drift 18s infinite alternate ease-in-out' }} />
    
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' }} />
    
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35, pointerEvents: 'none', mixBlendMode: 'overlay' }}>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>

    <style>{`
      @keyframes kira-drift {
        0% { transform: translate(0, 0); }
        100% { transform: translate(50px, 30px); }
      }
    `}</style>
  </div>
);

const NavWithStart = ({ onStart }: { onStart?: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Main navigation"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(3, 4, 10, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div role="img" aria-label="Kira-AI" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>K</div>
        <span style={{ fontWeight: 700, fontSize: '20px' }}>Kira-AI</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'rgba(255,255,255,0.03)', padding: '6px 24px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <a href="#features" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Features</a>
        <a href="#how" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>How it Works</a>
        <a href="#stack" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Stack</a>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>FREE · OPEN SOURCE</span>
        <button
          onClick={onStart}
          aria-label="Get started — upload your statement"
          style={{ background: 'linear-gradient(90deg, #9333ea, #3b82f6)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '99px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 15px rgba(147, 51, 234, 0.4)' }}
        >
          Get started
        </button>
      </div>
    </motion.nav>
  );
};

const PreviewCard = () => {
  const { scrollYProgress } = useScroll();
  const rotateX = useTransform(scrollYProgress, [0, 0.2], [2, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 2 }}
      transition={{ delay: 0.5, duration: 1, type: 'spring' }}
      style={{
        rotateX,
        y,
        width: '100%',
        maxWidth: '900px',
        height: '500px',
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 40px 100px rgba(147, 51, 234, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Title bar */}
      <div style={{ height: '44px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 120px', borderRadius: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
            kira-ai.app/coach
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: '200px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: 'white' }}>Coach</div>
          <div style={{ padding: '8px 12px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Forecast</div>
          <div style={{ padding: '8px 12px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Explain</div>
          <div style={{ padding: '8px 12px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Impact</div>
          <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Runway</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>9 days</div>
          </div>
        </div>
        
        {/* Main */}
        <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <StatusBadge status="critical" size="sm" />
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: 600, lineHeight: 1.4, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            You're spending 40% more on food delivery this week. At this rate, your balance hits ₹0 on the 24th.
          </h2>
          
          <GlassCard padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Action Plan: Cooking Challenge</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Pause Swiggy/Zomato for 4 days. Saves ~₹1,200.</div>
            </div>
            <KiraButton variant="secondary" size="sm">I'll do it</KiraButton>
          </GlassCard>
          
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', gap: '8px', height: '60px' }}>
            {[30, 45, 25, 40, 85, 95, 100].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: i > 3 ? '#ef4444' : 'rgba(255,255,255,0.2)', borderRadius: '4px 4px 0 0' }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const HeroWithStart = ({ onStart }: { onStart?: () => void }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', position: 'relative', zIndex: 1, padding: '80px 24px 40px' }}>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
        role="status"
        aria-label="Live: Behavioral Finance Intelligence"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', border: '1px solid rgba(157, 122, 255, 0.25)', background: 'rgba(157, 122, 255, 0.08)', marginBottom: '32px' }}
      >
        <motion.div aria-hidden="true" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Behavioral Finance Intelligence</span>
      </motion.div>
      
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{ fontSize: 'clamp(2.5rem, 8vw, 7.5rem)', fontWeight: 800, lineHeight: 1.1, textAlign: 'center', letterSpacing: '-3px', margin: '0 0 24px 0' }}
      >
        <div style={{ color: 'white' }}>Know Your</div>
        <div style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 400, background: 'linear-gradient(90deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Money</div>
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>Before It Disappears</div>
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{ fontWeight: 300, fontSize: '1.1rem', maxWidth: '520px', textAlign: 'center', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 40px 0' }}
      >
        Kira reads your UPI transactions, predicts exactly when you'll run out,
        and coaches you with AI-generated nudges before the crisis hits.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{ display: 'flex', gap: '16px', marginBottom: '80px', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <KiraButton variant="primary" size="lg" onClick={onStart} style={{ padding: '16px 32px', fontSize: '16px' }} aria-label="Upload your statement to start">
          Upload your statement <motion.span aria-hidden="true" style={{ display: 'inline-block' }} whileHover={{ x: 5 }}>→</motion.span>
        </KiraButton>
        <KiraButton variant="ghost" size="lg" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '16px 32px', fontSize: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
          See how it works
        </KiraButton>
      </motion.div>
      
      <PreviewCard />
    </div>
  );
};

function useCountUpAnimation(endValue: number, duration: number = 2, decimals: number = 0) {
  const [value, setValue] = useState("0");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let startTimestamp: number;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        const current = progress * endValue;
        setValue(current.toFixed(decimals));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [isInView, endValue, duration, decimals]);

  return { value, ref };
}

const Stat = ({ num, label, prefix = '', suffix = '', decimals = 0 }: { num: number, label: string, prefix?: string, suffix?: string, decimals?: number }) => {
  const { value, ref } = useCountUpAnimation(num, 2, decimals);
  return (
    <div ref={ref} className="stat-card" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'background 0.3s', cursor: 'default' }}>
      <div style={{ fontSize: '48px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
        {prefix}{value}{suffix}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {label}
      </div>
      <style>{`
        .stat-card:hover { background: rgba(168, 85, 247, 0.05); }
        .stat-card:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
};

const StatsStrip = () => {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', position: 'relative', zIndex: 1, marginTop: '120px' }}>
      <Stat num={800} suffix="M+" label="Parameters Processed" />
      <Stat num={93} label="Unit Tests Passed" />
      <Stat num={9.2} suffix="/10" decimals={1} label="User Satisfaction" />
      <Stat num={0} prefix="$" label="Cost Forever" />
    </div>
  );
};

const FeatureCard = ({ feature, index }: { feature: any, index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      whileHover={{ y: -4, boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)', borderColor: 'rgba(168, 85, 247, 0.5)' }}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '32px',
        transition: 'all 0.3s',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>{feature.num}</div>
      <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{feature.title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0, fontSize: '15px' }}>{feature.desc}</p>
    </motion.div>
  );
};

const FeaturesGrid = () => {
  const features = [
    { num: '01', title: 'Data Ingestion', desc: 'Securely processes raw UPI texts and converts them into structured JSON arrays.' },
    { num: '02', title: 'Pattern Recognition', desc: 'Identifies recurring expenses, subscriptions, and categorizes them automatically.' },
    { num: '03', title: 'Runway Forecasting', desc: 'Predicts your burn rate and exact date of hitting zero balance.' },
    { num: '04', title: 'Behavioral Nudges', desc: 'Generates context-aware, non-preachy advice before bad spending happens.' },
    { num: '05', title: 'LangGraph Reasoning', desc: 'Multi-agent orchestration to cross-check advice confidence and tone.' },
    { num: '06', title: 'Actionable Analytics', desc: 'Visualizes your habits in clean, simple charts that make sense.' },
  ];

  return (
    <div id="features" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <h2 style={{ fontSize: '48px', fontWeight: 800, textAlign: 'center', marginBottom: '64px' }}>
        Six systems. One <span style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 400, color: '#a855f7' }}>coach.</span>
      </h2>
      
      <style>{`
        @media (max-width: 768px) { .features-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 769px) and (max-width: 1024px) { .features-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
      <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {features.map((f, i) => (
          <FeatureCard key={i} feature={f} index={i} />
        ))}
      </div>
    </div>
  );
};

const LangGraphViz = () => {
  const [activeNode, setActiveNode] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode(prev => (prev + 1) % 5);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const nodes = ['Parser', 'Categorizer', 'Forecaster', 'Coach', 'Output'];
  
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {nodes.map((node, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <motion.div
              animate={{ 
                background: activeNode === i ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                borderColor: activeNode === i ? '#a855f7' : 'rgba(255,255,255,0.1)',
                scale: activeNode === i ? 1.1 : 1
              }}
              style={{ width: '48px', height: '48px', borderRadius: '12px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeNode === i ? '#a855f7' : 'rgba(255,255,255,0.2)' }} />
            </motion.div>
            <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: activeNode === i ? 'white' : 'rgba(255,255,255,0.4)' }}>{node}</div>
            {i < nodes.length - 1 && (
              <div style={{ position: 'absolute', top: '24px', left: '56px', width: '30px', height: '2px', background: activeNode >= i + 1 ? '#a855f7' : 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Confidence Score</div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div animate={{ width: `${60 + Math.random() * 35}%` }} transition={{ duration: 1.4 }} style={{ height: '100%', background: '#22c55e' }} />
          </div>
        </div>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Zero Balance ETA</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444' }}>Oct 24th</div>
        </div>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const steps = [
    "Upload raw SMS / UPI statement",
    "Data sanitized & structured",
    "Expense modeling & predictions",
    "Behavioral context generation",
    "Actionable nudges delivered"
  ];
  
  return (
    <div id="how" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', gap: '64px', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '40px' }}>How it Works</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} style={{ display: 'flex', gap: '24px', alignItems: 'center', position: 'relative' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0a0a0f', border: '2px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, zIndex: 2 }}>{i+1}</div>
              <div style={{ fontSize: '18px', fontWeight: 500 }}>{step}</div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <LangGraphViz />
      </div>
    </div>
  );
};

const TechMarquee = () => {
  const techs = ['React 18', 'TypeScript', 'Framer Motion', 'LangGraph', 'Gemini 1.5 Flash', 'FastAPI', 'Vite', 'Python 3.11', 'Pandas', 'Pydantic', 'Zustand', 'Recharts', 'JetBrains Mono', 'structlog', 'SlowAPI', 'Prometheus', 'React 18', 'TypeScript', 'Framer Motion', 'LangGraph', 'Gemini 1.5 Flash', 'FastAPI'];

  return (
    <div id="stack" style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      <div className="marquee-container" style={{ display: 'flex', gap: '32px', width: 'max-content', animation: 'kira-marquee 40s linear infinite' }}>
        {techs.map((tech, i) => (
          <div key={i} className="tech-chip" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '99px', fontSize: '14px', fontWeight: 500, transition: 'all 0.3s', cursor: 'default' }}>
            {tech}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes kira-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container:hover { animation-play-state: paused; }
        .tech-chip:hover { background: rgba(168, 85, 247, 0.1) !important; color: #a855f7; border-color: rgba(168, 85, 247, 0.3) !important; }
      `}</style>
    </div>
  );
};

const FinalCTAWithStart = ({ onStart }: { onStart?: () => void }) => {
  return (
    <div style={{ padding: '160px 24px', textAlign: 'center', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '30%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4), transparent 70%)', filter: 'blur(60px)', zIndex: -1 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: '50%', right: '30%', transform: 'translate(50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 70%)', filter: 'blur(60px)', zIndex: -1 }} />
      
      <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, marginBottom: '40px' }}>
        Ready to meet <span style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 400 }}>your money?</span>
      </h2>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={onStart}
        aria-label="Upload your statement and launch Kira-AI"
        style={{ background: 'white', color: 'black', border: 'none', padding: '20px 48px', borderRadius: '12px', fontSize: '18px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 40px rgba(255,255,255,0.2)', marginBottom: '48px' }}
      >
        Launch Kira-AI →
      </motion.button>
      
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
        MIT LICENSE · 93 TESTS · GEMINI 1.5 FLASH · LANGGRAPH
      </div>
    </div>
  );
};

export interface LandingScreenProps {
  onStart?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  return (
    <div className="landing-screen" style={{ backgroundColor: '#03040a', color: 'white', minHeight: '100vh', overflow: 'hidden', fontFamily: 'Outfit, sans-serif' }}>
      <BackgroundEffects />
      <NavWithStart onStart={onStart} />
      <HeroWithStart onStart={onStart} />
      <StatsStrip />
      <FeaturesGrid />
      <HowItWorks />
      <TechMarquee />
      <FinalCTAWithStart onStart={onStart} />
    </div>
  );
};
