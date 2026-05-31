import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, StatusBadge, KiraButton, KiraSkeleton } from '../ui';
import { useCountUp } from '../../hooks/useCountUp';
import { useTypewriter } from '../../hooks/useTypewriter';
import { ExternalLinkIcon } from '../ui/Icons';
import { useKiraStore } from '../../store/useKiraStore';

export interface CoachTabProps {
  loading?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
};

export const CoachTab: React.FC<CoachTabProps> = ({ loading: loadingProp }) => {
  const { coachData, coachLoading, session, loadDemoSession } = useKiraStore();
  const loading = loadingProp ?? coachLoading;
  const data = coachData;

  // ── Skeleton state (Only show when actively loading) ──────────────────────
  if (loading) {
    return (
      <motion.div
        variants={containerVariants} initial="hidden" animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
        role="status" aria-label="Loading coach data"
      >
        {[140, 180, 150, 80].map((h, i) => (
          <motion.div key={i} variants={itemVariants}><KiraSkeleton height={h} variant="card" /></motion.div>
        ))}
      </motion.div>
    );
  }

  // ── Empty session state (Show CTA + Blurred mock preview) ──────────────────
  if (!data) {
    return (
      <motion.div
        variants={containerVariants} initial="hidden" animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', position: 'relative' }}
      >
        {/* Absolute CTA Overlay card */}
        <motion.div
          variants={itemVariants}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            pointerEvents: 'auto',
          }}
        >
          <div style={{
            maxWidth: '480px',
            background: 'rgba(13, 15, 23, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: '24px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(168, 85, 247, 0.15)',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              ⚡
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '20px', color: 'white', margin: '0 0 12px 0' }}>
              Personal AI Coach Offline
            </h3>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: '14.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, margin: '0 0 24px 0' }}>
              No statement session is currently active. Upload a bank statement inside the Upload tab to start coaching, or load our fully featured sample session instantly to see Kira-AI in action.
            </p>
            <KiraButton
              variant="success"
              size="md"
              onClick={loadDemoSession}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                color: 'white',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(168, 85, 247, 0.35)',
                width: '100%',
                padding: '12px 24px',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              ⚡ Load Sample Coach Session
            </KiraButton>
          </div>
        </motion.div>

        {/* Blurred preview background */}
        <div style={{ filter: 'blur(8px)', opacity: 0.28, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          {/* Status badge and runway mock */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>Financial Status</div>
                <StatusBadge status="watch" />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '3rem', color: '#f59e0b', lineHeight: 1 }}>18</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>days of runway</div>
              </div>
            </div>
          </GlassCard>

          {/* Advice card mock */}
          <GlassCard accent="purple">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ padding: '3px 8px', background: 'rgba(168,85,247,0.12)', color: '#a855f7', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>KIRA SAYS</div>
              <div style={{ padding: '3px 8px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '99px', fontSize: '10px', fontWeight: 600 }}>91% confidence</div>
            </div>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.65, margin: 0 }}>
              Kira detected a spike in discretionary Food Delivery transactions. At this rate, your primary runway exhausts 18 days early. Recommendation: Cap Swiggy caps immediately.
            </p>
          </GlassCard>

          {/* Action card mock */}
          <GlassCard accent="blue">
            <div style={{ fontSize: '9px', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '10px' }}>Today's Action</div>
            <p style={{ fontWeight: 500, fontSize: '14px', color: 'white', margin: 0 }}>
              Cap Swiggy at ₹2,000 this week to extend cash runway by 6 days.
            </p>
          </GlassCard>
        </div>
      </motion.div>
    );
  }

  // ── Hooks — always called, never conditional ─────────────────────────────
  const { displayedText, isTyping } = useTypewriter(data.narrative, 14);
  const runwayCount = useCountUp(data.runwayDays, 1.5);
  const [actionState, setActionState] = React.useState<'idle' | 'accepted' | 'dismissed'>('idle');
  const [showGitlab, setShowGitlab] = React.useState(true);

  const runwayColor = data.runwayDays > 14 ? '#22c55e' : data.runwayDays >= 7 ? '#f59e0b' : '#ef4444';
  const confidenceLabel = `${data.confidence}% confidence`;

  return (
    <motion.div
      variants={containerVariants} initial="hidden" animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}
    >
      {/* 1. STATUS HERO */}
      <motion.div
        variants={itemVariants}
        animate={data.status === 'critical' ? {
          boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 32px rgba(239,68,68,0.35)', '0 0 0px rgba(239,68,68,0)'],
          transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
        } : {}}
        style={{ borderRadius: '16px' }}
      >
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.08em' }}>
                Financial Status
              </div>
              <StatusBadge status={data.status} />
              {session && (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '10px' }}>
                  Session {session.uploadId.slice(-8)}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: runwayColor, lineHeight: 1 }}
                aria-label={`${data.runwayDays} days of runway remaining`}
              >
                {runwayCount}
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
                days of runway
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* 2. KIRA SAYS */}
      <motion.div variants={itemVariants}>
        <GlassCard accent="purple">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ padding: '3px 8px', background: 'rgba(168,85,247,0.12)', color: '#a855f7', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 600 }}>
              KIRA SAYS
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{ padding: '3px 8px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '99px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 600 }}
                aria-label={confidenceLabel}
              >
                {confidenceLabel}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                gemini-1.5-flash
              </div>
            </div>
          </div>

          <p
            style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: '15px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.65, margin: 0, minHeight: '3.5em' }}
            aria-live="polite"
          >
            {displayedText}
            <AnimatePresence>
              {isTyping && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                  aria-hidden="true"
                  style={{ display: 'inline-block', marginLeft: '1px', color: '#a855f7', fontWeight: 700 }}
                >
                  |
                </motion.span>
              )}
            </AnimatePresence>
          </p>
        </GlassCard>
      </motion.div>

      {/* 3. TODAY'S ACTION */}
      <motion.div variants={itemVariants}>
        <GlassCard accent="blue">
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.08em' }}>
            Today's Action
          </div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '14px', color: 'rgba(255,255,255,0.95)', marginBottom: '20px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
            {data.actionText}
          </p>

          <AnimatePresence mode="wait">
            {actionState === 'idle' ? (
              <motion.div
                key="buttons"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', gap: '12px' }}
              >
                <KiraButton size="sm" variant="success" onClick={() => setActionState('accepted')}>
                  ✓ I'll do it
                </KiraButton>
                <KiraButton size="sm" variant="ghost" onClick={() => setActionState('dismissed')}>
                  ✗ Skip for now
                </KiraButton>
              </motion.div>
            ) : (
              <motion.p
                key="feedback"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                aria-live="polite"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: actionState === 'accepted' ? '#22c55e' : 'rgba(255,255,255,0.4)', margin: 0 }}
              >
                {actionState === 'accepted' ? '✓ Reward +1 logged — Kira learns' : '✗ Reward −1 logged — Kira adapts'}
              </motion.p>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* 4. FINANCIAL TIP */}
      <motion.div variants={itemVariants}>
        <GlassCard accent="amber" padding="sm">
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#f59e0b', marginBottom: '8px', letterSpacing: '0.08em' }}>
            💡 Tip of the session
          </div>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, margin: 0 }}>
            {data.tipText}
          </p>
        </GlassCard>
      </motion.div>

      {/* 5. SUGGESTED CAP */}
      <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '0 4px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400, fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
          Kira recommends:
        </span>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: '#3b82f6' }} aria-label={`Suggested spending cap: ₹${data.suggestedCap.toLocaleString('en-IN')} per week`}>
          ₹{data.suggestedCap.toLocaleString('en-IN')} / week
        </span>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300, fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
          on {data.topCategory}
        </span>
      </motion.div>

      {/* 6. GITLAB ALERT */}
      <AnimatePresence>
        {data.gitlabUrl && showGitlab && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, height: 0, overflow: 'hidden', marginTop: 0 }}
          >
            <GlassCard accent="none" padding="sm" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.22)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href={data.gitlabUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f97316', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 500 }}
                >
                  🦊 Alert logged to GitLab <ExternalLinkIcon size={14} color="#f97316" />
                </a>
                <button
                  onClick={() => setShowGitlab(false)}
                  aria-label="Dismiss GitLab alert"
                  style={{ background: 'transparent', border: 'none', color: 'rgba(249,115,22,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px' }}
                >
                  ✕
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. WHATSAPP NUDGE */}
      <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '8px', marginBottom: '24px' }}>
        <KiraButton
          variant="ghost"
          size="md"
          onClick={() => window.open(data.whatsappLink, '_blank', 'noopener,noreferrer')}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
          aria-label="Send coaching summary to WhatsApp"
        >
          <span aria-hidden="true" style={{ fontSize: '16px' }}>📱</span>
          Send to WhatsApp
        </KiraButton>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
          {data.whatsappLink.length > 50 ? `${data.whatsappLink.slice(0, 47)}…` : data.whatsappLink}
        </div>
      </motion.div>
    </motion.div>
  );
};
