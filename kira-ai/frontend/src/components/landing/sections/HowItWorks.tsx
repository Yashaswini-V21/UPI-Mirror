import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../DesignTokens';

export const HowItWorks: React.FC = () => {
  const [votes, setVotes] = useState<Record<number, number>>({ 0: 942, 1: 818, 2: 605, 3: 411 });
  const [upvoted, setUpvoted] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false, 3: false });
  const [expandedLogIdx, setExpandedLogIdx] = useState<number | null>(0);

  const toggleUpvote = (id: number) => {
    setUpvoted(prev => {
      const isUp = !!prev[id];
      setVotes(v => ({ ...v, [id]: isUp ? v[id] - 1 : v[id] + 1 }));
      return { ...prev, [id]: !isUp };
    });
  };

  const steps = [
    { id: 0, channel: 'local-privacy-core', author: 'wasm_sandbox_agent', time: '5m ago', title: 'WASM local parser strips PII in browser sandbox before dispatch', desc: 'Raw bank statements never touch Kira-AI servers unencrypted. Our Regex de-identification core executes client-side inside volatile browser memory, completely scrubbing names, account numbers, and transaction IDs.', tags: ['#wasm', '#regex-masking', '#client-privacy'], color: C.indigo, comments: 42, cmd: 'KIRA_INGEST: parsed 128 rows. Scrubbed merchant UPI parameters. Dispatching anonymous vector payload.' },
    { id: 1, channel: 'langgraph-coordinator', author: 'graph_supervisor', time: '12m ago', title: 'LangGraph supervisor agent coordinates runway drain regressions', desc: 'An intelligent coordinator agent charts day-zero runway parameters, spawning expert sub-agents to trace food/ride subscription loops, verify spike anomalies, and construct tone-compliant budget recovery warnings.', tags: ['#langgraph', '#supervisors', '#regressions'], color: C.pink, comments: 29, cmd: 'KIRA_FORECAST: calculated daily burn baseline. Weekend food spike flagged. Spawning sub-agent auditors.' },
    { id: 2, channel: 'whatsapp-alert-bridge', author: 'twilio_bridge_dispatcher', time: '28m ago', title: 'Real-time SMS & WhatsApp alerts push actionable lockscreen budget warnings', desc: 'Kira-AI syncs securely with communications bridges to push instant, actionable WhatsApp reminders to your mobile phone. Budget warnings come with custom 1-click reward acceptance feedback tags.', tags: ['#whatsapp', '#user-nudges', '#feedback-loop'], color: C.teal, comments: 18, cmd: 'KIRA_DISPATCH: Alert payload constructed. Transmitting secure WhatsApp lockscreen nudge. Awaiting reward callback.' },
    { id: 3, channel: 'gitlab-issue-hardener', author: 'repo_ticket_auditor', time: '45m ago', title: 'GitLab ticket auto-logging enables advanced programmatic team hardening', desc: 'For power users and dev teams, critical cash runway alerts can be logged programmatically as structured GitLab issues, automatically mapping financial anomalies to code logs for continuous team auditing.', tags: ['#gitlab-api', '#system-audits', '#team-hardening'], color: '#f59e0b', comments: 12, cmd: 'KIRA_AUDIT: Critical burn logged to GitLab API. Ticket #889 opened. Pipeline checklist audit passed.' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.9 }} id="howitworks" style={{ padding: '120px 24px', maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)', width: '100%', marginBottom: '80px' }} />

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {steps.map(step => {
          const isUp = !!upvoted[step.id];
          const score = votes[step.id];
          const isExpanded = expandedLogIdx === step.id;

          return (
            <motion.div key={step.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }} style={{ background: 'rgba(5,5,14,0.72)', border: isUp ? `1px solid ${step.color}60` : `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', display: 'flex', gap: '20px', boxShadow: isUp ? `0 15px 35px rgba(0,0,0,0.6),0 0 20px ${step.color}15` : '0 10px 30px rgba(0,0,0,0.4)', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', alignItems: 'flex-start' }}>
              {/* Upvote */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <motion.button onClick={() => toggleUpvote(step.id)} whileTap={{ scale: 0.85 }} style={{ background: isUp ? step.color : 'rgba(255,255,255,0.03)', border: isUp ? 'none' : `1px solid rgba(255,255,255,0.08)`, color: isUp ? 'black' : 'rgba(255,255,255,0.6)', width: '42px', height: '42px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: isUp ? `0 0 12px ${step.color}` : 'none' }} onMouseEnter={e => { if (!isUp) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseLeave={e => { if (!isUp) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </motion.button>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: isUp ? step.color : 'white', transition: 'color 0.2s' }}>{score}</span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: C.textFaint, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: step.color, fontWeight: 700 }}>in/{step.channel}</span>
                  <span>•</span><span>Posted by u/{step.author}</span>
                  <span>•</span><span>{step.time}</span>
                </div>

                <h4 onClick={() => toggleUpvote(step.id)} style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif', cursor: 'pointer', lineHeight: 1.35 }} onMouseEnter={e => (e.currentTarget.style.color = step.color)} onMouseLeave={e => (e.currentTarget.style.color = 'white')}>{step.title}</h4>
                <p style={{ fontSize: '13.5px', color: C.textMuted, margin: '4px 0 10px 0', lineHeight: 1.58, fontFamily: 'Outfit, sans-serif' }}>{step.desc}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {step.tags.map(tag => (<span key={tag} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '4px', border: `1px solid rgba(255,255,255,0.05)` }}>{tag}</span>))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontFamily: 'Outfit, sans-serif', color: C.textMuted }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.color = step.color)} onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}>💬 {step.comments} Comments</span>
                    <button onClick={() => setExpandedLogIdx(isExpanded ? null : step.id)} style={{ background: 'transparent', border: 'none', color: isExpanded ? step.color : C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: isExpanded ? 700 : 400, transition: 'color 0.2s' }} onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.color = step.color; }} onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.color = C.textMuted; }}>
                      ⚙ Telemetry Logs {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: 'hidden', marginTop: '14px' }}>
                      <div style={{ background: '#04040c', border: `1px solid ${step.color}35`, borderRadius: '16px', padding: '16px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: step.color, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.85)', lineHeight: 1.4 }}>
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
