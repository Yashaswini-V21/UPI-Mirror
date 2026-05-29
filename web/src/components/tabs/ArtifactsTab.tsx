import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, KiraButton } from '../ui';
import { Play, Code, Smartphone, Tablet, Monitor, RefreshCw, Download, Star, CheckCircle, ChevronRight, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// ── TYPES ──
type CompilePhase = 'tokenize' | 'synthesis' | 'styling' | 'springs' | 'complete';
type ViewportSize = 'mobile' | 'tablet' | 'desktop';
type WidgetId = 'runway' | 'burn' | 'quest' | 'gravity';

interface WidgetTemplate {
  id: WidgetId;
  title: string;
  description: string;
  prompt: string;
  code: string;
}

const TEMPLATES: WidgetTemplate[] = [
  {
    id: 'runway',
    title: 'Runway Liquid Simulator',
    description: 'An interactive liquid wave indicator that updates cash runway days based on caps.',
    prompt: 'Create a neomorphic liquid wave gauge reflecting cash runway days remaining, controlled by three spending sliders.',
    code: `import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function RunwayLiquid() {
  const [income, setIncome] = useState(45000);
  const [foodCap, setFoodCap] = useState(4000);
  const [subCut, setSubCut] = useState(0);

  // Compute runway days based on sliders
  const expense = 15000 + foodCap - (subCut * 2000 / 100);
  const burnRate = expense / 30;
  const runwayDays = Math.round(income / (burnRate > 0 ? burnRate : 1));

  const waveHeight = Math.min(100, Math.max(10, (runwayDays / 90) * 100));
  const liquidColor = runwayDays > 30 ? '#22c55e' : runwayDays >= 14 ? '#eab308' : '#ef4444';

  return (
    <div className="liquid-sim-card">
      <h3>Cash Runway Simulator</h3>
      <div className="liquid-gauge">
        <svg viewBox="0 0 100 100">
          <path d="M 0 50 Q 25 45, 50 50 T 100 50 L 100 100 L 0 100 Z" fill={liquidColor} />
        </svg>
        <span>{runwayDays} Days</span>
      </div>
    </div>
  );
}`
  },
  {
    id: 'burn',
    title: 'Burn Rate Trajectory Morph',
    description: 'An expenditure area chart showcasing trajectory morphing when Emergency Mode is active.',
    prompt: 'Build a dark-themed area chart showing daily spend, with an emergency savings toggle that morphs spend curves.',
    code: `import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function BurnTrajectory() {
  const [emergency, setEmergency] = useState(false);

  const basePoints = [40, 65, 30, 85, 50, 95, 45];
  const emergencyPoints = [20, 30, 15, 40, 25, 45, 20];

  const points = emergency ? emergencyPoints : basePoints;

  return (
    <div className="burn-morph-card">
      <div className="header">
        <h3>Daily Burn Rate Trajectory</h3>
        <button onClick={() => setEmergency(!emergency)}>
          {emergency ? 'Emergency ON' : 'Normal Mode'}
        </button>
      </div>
      <div className="chart">
        {points.map((p, i) => (
          <motion.div key={i} animate={{ height: \`\${p}%\` }} />
        ))}
      </div>
    </div>
  );
}`
  },
  {
    id: 'quest',
    title: 'Budget Quest Milestones',
    description: 'A gamified checklists interface giving XP scores and milestone unlock overlays.',
    prompt: 'Build a gamified savings checklist where achievements award XP, updating a progress bar to unlock milestones.',
    code: `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BudgetQuest() {
  const [xp, setXp] = useState(0);
  const [quests, setQuests] = useState([
    { id: 1, label: 'Skip gourmet delivery today', xp: 100, done: false },
    { id: 2, label: 'Cancel one unused subscription', xp: 200, done: false }
  ]);

  const toggleQuest = (id) => {
    setQuests(quests.map(q => q.id === id ? { ...q, done: !q.done } : q));
    const quest = quests.find(q => q.id === id);
    setXp(xp + (quest.done ? -quest.xp : quest.xp));
  };

  return (
    <div className="quest-container">
      <h3>Savings Quest Board</h3>
      <div className="progress" style={{ width: \`\${xp/3}%\` }} />
    </div>
  );
}`
  },
  {
    id: 'gravity',
    title: 'Expense Gravity Bubble Sort',
    description: 'A drag-and-sort canvas sorting floating transactions into Essential vs Discretionary bins.',
    prompt: 'Create a bubbles interface with floating transactions that can be clicked to sort into categories.',
    code: `import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function GravitySort() {
  const [items, setItems] = useState([
    { name: 'Salary', val: 45000, cat: 'income' },
    { name: 'Swiggy', val: 750, cat: 'discretionary' }
  ]);

  return (
    <div className="gravity-sandbox">
      {items.map(item => (
        <motion.div drag key={item.name}>{item.name}</motion.div>
      ))}
    </div>
  );
}`
  }
];

export const ArtifactsTab: React.FC = () => {
  const [promptInput, setPromptInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate>(TEMPLATES[0]);
  const [activeWidget, setActiveWidget] = useState<WidgetId | null>(null);
  
  // Compiler animation states
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilePhase, setCompilePhase] = useState<CompilePhase>('tokenize');
  const [progress, setProgress] = useState(0);
  const [compilerLogs, setCompilerLogs] = useState<string[]>([]);
  const [visibleCode, setVisibleCode] = useState('');
  
  // Viewport states
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [isCodeView, setIsCodeView] = useState(false);
  const [renderedWidget, setRenderedWidget] = useState<WidgetId | null>(null);

  // Widget 1: Runway Liquid Simulator internal states
  const [incomeSlider, setIncomeSlider] = useState(48000);
  const [foodSlider, setFoodSlider] = useState(5500);
  const [subSlider, setSubSlider] = useState(0);

  // Widget 2: Burn Trajectory Morph internal states
  const [emergencySavingsMode, setEmergencySavingsMode] = useState(false);

  // Widget 3: Budget Quest internal states
  const [playerXp, setPlayerXp] = useState(0);
  const [milestoneUnlocked, setMilestoneUnlocked] = useState(false);
  const [questItems, setQuestItems] = useState([
    { id: 1, label: 'Skip Food Delivery today', xp: 120, done: false, value: 650 },
    { id: 2, label: 'Cancel one unused subscription', xp: 200, done: false, value: 499 },
    { id: 3, label: 'Take public transit instead of Uber', xp: 80, done: false, value: 350 },
    { id: 4, label: 'Brew coffee at home', xp: 50, done: false, value: 180 },
    { id: 5, label: 'Skip weekend pub visit', xp: 150, done: false, value: 1200 }
  ]);

  // Widget 4: Gravity Bubble Sort internal states
  const [bubbles, setBubbles] = useState([
    { id: '1', label: 'Salary: +₹45,000', type: 'essential', val: 45000, sorted: false },
    { id: '2', label: 'Swiggy: ₹850', type: 'discretionary', val: -850, sorted: false },
    { id: '3', label: 'Rent: ₹12,000', type: 'essential', val: -12000, sorted: false },
    { id: '4', label: 'Netflix: ₹499', type: 'discretionary', val: -499, sorted: false },
    { id: '5', label: 'Zomato: ₹620', type: 'discretionary', val: -620, sorted: false },
    { id: '6', label: 'Electric Bill: ₹2,100', type: 'essential', val: -2100, sorted: false }
  ]);
  const [gravityScore, setGravityScore] = useState(0);

  // Trigger Compilation sequence
  const startGeneration = (template: WidgetTemplate) => {
    setIsCompiling(true);
    setCompilePhase('tokenize');
    setProgress(0);
    setCompilerLogs([]);
    setVisibleCode('');
    setRenderedWidget(null);
    setActiveWidget(template.id);
    
    // Reset widget-specific states
    setIncomeSlider(48000);
    setFoodSlider(5500);
    setSubSlider(0);
    setEmergencySavingsMode(false);
    setPlayerXp(0);
    setMilestoneUnlocked(false);
    setQuestItems(items => items.map(it => ({ ...it, done: false })));
    setBubbles(b => b.map(x => ({ ...x, sorted: false })));
    setGravityScore(0);
  };

  // Compile Progress Orchestrator
  useEffect(() => {
    if (!isCompiling || !activeWidget) return;

    const template = TEMPLATES.find(t => t.id === activeWidget) || TEMPLATES[0];
    let intervalId: any;
    
    const logsList = [
      '[Tokenizer] Scanning input tokens for UI structures...',
      '[Tokenizer] Grid matrix dimensions set to responsive bounds.',
      '[Synthesis] Assembling AST tree hierarchy elements...',
      '[Synthesis] Mapping React hooks: useState, useEffect, useMemo.',
      '[Synthesis] Compiling TSX markup logic nodes...',
      '[Styling] Injecting HSL color scheme parameters...',
      '[Styling] Resolving glassmorphic backdrop filter rules...',
      '[Springs] Compiling framer-motion physics equations...',
      '[Springs] Binding spring damping values (damping: 24)...',
      '[Compiler] Running syntax safety audit checks. Status: OK',
      '[Compiler] Rendering virtual viewport mount...'
    ];

    let logIndex = 0;
    const addLogs = setInterval(() => {
      if (logIndex < logsList.length) {
        setCompilerLogs(prev => [...prev, logsList[logIndex]]);
        logIndex++;
      }
    }, 280);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        
        // Phase switches
        if (next < 25) setCompilePhase('tokenize');
        else if (next < 55) setCompilePhase('synthesis');
        else if (next < 78) setCompilePhase('styling');
        else if (next < 95) setCompilePhase('springs');
        else setCompilePhase('complete');

        // Streaming Code simulation
        const codeLength = template.code.length;
        const sliceEnd = Math.floor((next / 100) * codeLength);
        setVisibleCode(template.code.slice(0, sliceEnd));

        if (next >= 100) {
          clearInterval(progressTimer);
          clearInterval(addLogs);
          setTimeout(() => {
            setIsCompiling(false);
            setRenderedWidget(activeWidget);
            toast.success('Artifact successfully built & loaded!');
          }, 600);
          return 100;
        }
        return next;
      });
    }, 45);

    return () => {
      clearInterval(progressTimer);
      clearInterval(addLogs);
    };
  }, [isCompiling, activeWidget]);

  // Widget 1: Calculations
  const calculatedExpense = 12000 + foodSlider - (subSlider * 1500 / 100);
  const dailyBurn = calculatedExpense / 30;
  const calculatedRunway = Math.round(incomeSlider / (dailyBurn > 0 ? dailyBurn : 1));
  const runwayColor = calculatedRunway > 30 ? '#22c55e' : calculatedRunway >= 14 ? '#eab308' : '#ef4444';
  const liquidPercent = Math.min(100, Math.max(10, (calculatedRunway / 90) * 100));

  // Widget 3: Milestones Handler
  const handleQuestToggle = (id: number) => {
    setQuestItems(items => items.map(q => {
      if (q.id === id) {
        const nextState = !q.done;
        const diff = nextState ? q.xp : -q.xp;
        setPlayerXp(xp => {
          const newXp = Math.max(0, xp + diff);
          if (newXp >= 400 && !milestoneUnlocked) {
            setMilestoneUnlocked(true);
            toast.success('Milestone Unlocked! Savvy Saver Badge Earned.');
          }
          return newXp;
        });
        return { ...q, done: nextState };
      }
      return q;
    }));
  };

  // Widget 4: Gravity bubbles handler
  const handleBubbleSort = (id: string, bucket: 'essential' | 'discretionary') => {
    setBubbles(items => items.map(b => {
      if (b.id === id) {
        if (b.type === bucket) {
          setGravityScore(s => s + 100);
          toast.success('Sorted correctly! +100 XP');
          return { ...b, sorted: true };
        } else {
          toast.error('Incorrect category! Try again.');
        }
      }
      return b;
    }));
  };

  // Preset quick triggers
  const handlePresetSelect = (temp: WidgetTemplate) => {
    setSelectedTemplate(temp);
    setPromptInput(temp.prompt);
    startGeneration(temp);
  };

  const handleDownloadCode = () => {
    const activeCode = TEMPLATES.find(t => t.id === renderedWidget)?.code || '';
    navigator.clipboard.writeText(activeCode);
    toast.success('Code copied to clipboard!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      
      {/* ── PROMPT HUB ── */}
      {!isCompiling && !renderedWidget && (
        <GlassCard accent="purple" glow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#a855f7', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1.5px' }}>
                AI GENERATIVE SANDBOX
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                What would you like to build?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13.5px', marginTop: '6px', margin: 0 }}>
                Type a custom prompt to compile interactive neomorphic layouts, or pick a storytelling template below.
              </p>
            </div>

            {/* Prompt Form */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="e.g. Create a Runway Liquid Simulator with fluid wave indicators..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  color: 'white',
                  fontSize: '14.5px',
                  outline: 'none',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.3s'
                }}
              />
              <KiraButton
                variant="primary"
                onClick={() => startGeneration(selectedTemplate)}
                disabled={!promptInput.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', background: 'linear-gradient(90deg, #a855f7, #06b6d4)' }}
              >
                <Play size={16} fill="white" />
                Build
              </KiraButton>
            </div>

            {/* Presets List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                Quick Templates
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {TEMPLATES.map((temp) => (
                  <div
                    key={temp.id}
                    onClick={() => handlePresetSelect(temp)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)';
                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.03)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <span style={{ fontWeight: 650, fontSize: '14px', color: 'white' }}>{temp.title}</span>
                    <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{temp.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── COMPILER STORYTELLING SCREEN ── */}
      <AnimatePresence>
        {isCompiling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%' }}
          >
            <GlassCard glow>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', minHeight: '380px', flexWrap: 'wrap' }}>
                
                {/* Left: Code Generation Stream */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '10px', height: '10px', border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      AI Logic Synthesis: {compilePhase.toUpperCase()}
                    </span>
                  </div>

                  <div style={{
                    flex: 1,
                    background: 'rgba(3, 4, 10, 0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '20px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11.5px',
                    color: '#a7f3d0',
                    overflowY: 'auto',
                    maxHeight: '320px',
                    whiteSpace: 'pre-wrap',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)'
                  }}>
                    {visibleCode || '// Fetching synthesis buffers...'}
                  </div>
                </div>

                {/* Right: Steps & Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'white', fontFamily: 'Outfit, sans-serif' }}>Compiling Code...</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #06b6d4)', borderRadius: '99px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.6)' }}>{progress}%</span>
                    </div>
                  </div>

                  {/* Flow Stages */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'tokenize', label: 'Analyzing Intent & Layout AST' },
                      { id: 'synthesis', label: 'Synthesizing React State Hooks' },
                      { id: 'styling', label: 'Injecting HSL Design System' },
                      { id: 'springs', label: 'Compiling Framer Springs' }
                    ].map((phase, idx) => {
                      const isDone = progress >= (idx + 1) * 25;
                      const isActive = compilePhase === phase.id;
                      return (
                        <div
                          key={phase.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: isActive ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.01)',
                            border: isActive ? '1px solid rgba(168,85,247,0.3)' : '1px solid transparent',
                            color: isDone ? 'white' : isActive ? '#c084fc' : 'rgba(255,255,255,0.3)',
                            transition: 'all 0.3s'
                          }}
                        >
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            border: isDone ? 'none' : '1.5px solid currentColor',
                            background: isDone ? '#22c55e' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: 'white'
                          }}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400 }}>{phase.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Console logs terminal */}
                  <div style={{
                    flex: 1,
                    background: 'rgba(3, 4, 10, 0.9)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.5)',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {compilerLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>

                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIEWPORT SANDBOX ── */}
      {renderedWidget && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {/* Left: Viewport toggle sizes */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[
                { size: 'mobile', icon: Smartphone, label: 'Mobile' },
                { size: 'tablet', icon: Tablet, label: 'Tablet' },
                { size: 'desktop', icon: Monitor, label: 'Desktop' }
              ].map(v => (
                <button
                  key={v.size}
                  onClick={() => setViewportSize(v.size as ViewportSize)}
                  style={{
                    background: viewportSize === v.size ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none', color: viewportSize === v.size ? 'white' : 'rgba(255,255,255,0.5)',
                    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', transition: 'all 0.2s'
                  }}
                >
                  <v.icon size={14} />
                  <span className="desktop-only">{v.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Code view, Copy Code, Regen */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => setIsCodeView(!isCodeView)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '7px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isCodeView ? <Play size={14} /> : <Code size={14} />}
                {isCodeView ? 'Live Preview' : 'View Code'}
              </button>

              <button
                onClick={handleDownloadCode}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '7px 14px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} />
                Copy
              </button>

              <button
                onClick={() => startGeneration(TEMPLATES.find(t => t.id === renderedWidget) || TEMPLATES[0])}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.7)',
                  padding: '7px 12px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} />
              </button>

              <KiraButton
                variant="ghost"
                size="sm"
                onClick={() => setRenderedWidget(null)}
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Back to Sandbox
              </KiraButton>
            </div>
          </div>

          {/* Sandbox Render Container */}
          <GlassCard padding="none">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(3, 4, 10, 0.4)',
              padding: '32px 16px',
              minHeight: '440px',
              transition: 'all 0.3s'
            }}>
              
              {isCodeView ? (
                /* CODE PREVIEW */
                <div style={{
                  width: '100%',
                  maxWidth: '820px',
                  background: '#040711',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  padding: '24px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12.5px',
                  color: '#a7f3d0',
                  overflowX: 'auto',
                  textAlign: 'left'
                }}>
                  <pre>{TEMPLATES.find(t => t.id === renderedWidget)?.code}</pre>
                </div>
              ) : (
                /* RESPONSIVE VIEWPORT IFRAME-LIKE CONTAINER */
                <div
                  style={{
                    width: viewportSize === 'mobile' ? '360px' : viewportSize === 'tablet' ? '640px' : '100%',
                    background: 'rgba(10, 12, 22, 0.95)',
                    border: '1.5px solid rgba(168, 85, 247, 0.22)',
                    borderRadius: '16px',
                    padding: '28px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                    transition: 'width 0.3s ease',
                    minHeight: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  {/* Title of active sandbox widget */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      RENDERED_WIDGET_SANDBOX
                    </span>
                  </div>

                  {/* ──────────────────────────────────────────────────────── */}
                  {/* WIDGET 1: RUNWAY LIQUID SIMULATOR */}
                  {/* ──────────────────────────────────────────────────────── */}
                  {renderedWidget === 'runway' && (
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', flex: 1 }}>
                      
                      {/* Left: Interactive Sliders */}
                      <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                          Kira Runway Simulator
                        </h3>

                        {/* Income Slider */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Monthly Income (Account Balance)</span>
                            <span style={{ fontWeight: 'bold', color: '#c084fc' }}>₹{incomeSlider.toLocaleString('en-IN')}</span>
                          </div>
                          <input
                            type="range" min="15000" max="100000" step="1000" value={incomeSlider} onChange={(e) => setIncomeSlider(Number(e.target.value))}
                            style={{ accentColor: '#a855f7', width: '100%', cursor: 'pointer' }}
                          />
                        </div>

                        {/* Food Delivery Spend Cap */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Food Delivery Spend Cap (₹/mo)</span>
                            <span style={{ fontWeight: 'bold', color: '#06b6d4' }}>₹{foodSlider.toLocaleString('en-IN')}</span>
                          </div>
                          <input
                            type="range" min="1000" max="15000" step="500" value={foodSlider} onChange={(e) => setFoodSlider(Number(e.target.value))}
                            style={{ accentColor: '#06b6d4', width: '100%', cursor: 'pointer' }}
                          />
                        </div>

                        {/* Subscriptions cut percentage */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Cut Unused Subscriptions</span>
                            <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{subSlider}%</span>
                          </div>
                          <input
                            type="range" min="0" max="100" step="10" value={subSlider} onChange={(e) => setSubSlider(Number(e.target.value))}
                            style={{ accentColor: '#22c55e', width: '100%', cursor: 'pointer' }}
                          />
                        </div>

                        {/* Spend Summary */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                          <span style={{ color: 'rgba(255,255,255,0.45)' }}>Estimated Burn: ₹{Math.round(calculatedExpense).toLocaleString('en-IN')}/mo</span>
                          <span style={{ color: 'rgba(255,255,255,0.45)' }}>Daily: ₹{Math.round(dailyBurn).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Right: Liquid Gauge */}
                      <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', minWidth: '160px' }}>
                        <div style={{
                          width: '130px', height: '130px', borderRadius: '50%',
                          border: `2px solid ${runwayColor}`,
                          position: 'relative', overflow: 'hidden',
                          background: 'rgba(3, 4, 10, 0.4)',
                          boxShadow: `0 0 20px ${runwayColor}22`
                        }}>
                          {/* SVG Liquid wave mask */}
                          <motion.div
                            animate={{
                              y: `${100 - liquidPercent}%`,
                              rotate: [0, 4, 0]
                            }}
                            transition={{
                              y: { type: 'spring', stiffness: 45, damping: 10 },
                              rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                            }}
                            style={{
                              position: 'absolute', inset: 0,
                              background: `linear-gradient(to top, ${runwayColor} 60%, ${runwayColor}bb 100%)`,
                              borderRadius: '40% 40% 0 0',
                              transformOrigin: '50% 50%'
                            }}
                          />
                          {/* Centered Readout text */}
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, textShadow: '0 2px 5px rgba(0,0,0,0.6)'
                          }}>
                            <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                              {calculatedRunway}
                            </span>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                              Days Runway
                            </span>
                          </div>
                        </div>

                        {/* Alert Badge */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={calculatedRunway < 14 ? 'alert' : 'stable'}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                          >
                            <span style={{
                              padding: '5px 12px', borderRadius: '99px', fontSize: '11.5px', fontWeight: 700,
                              background: calculatedRunway < 14 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                              color: calculatedRunway < 14 ? '#ef4444' : '#22c55e',
                              border: `1px solid ${calculatedRunway < 14 ? '#ef444433' : '#22c55e33'}`
                            }}>
                              {calculatedRunway < 14 ? '⚠️ Critical Runway Status' : '✓ Cash Runway Stable'}
                            </span>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────── */}
                  {/* WIDGET 2: BURN TRAJECTORY MORPH */}
                  {/* ──────────────────────────────────────────────────────── */}
                  {renderedWidget === 'burn' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                            Burn Trajectory Morph
                          </h3>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Simulate Emergency Cap reduction</span>
                        </div>

                        {/* Emergency Toggle Switch */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: emergencySavingsMode ? '#22c55e' : 'rgba(255,255,255,0.45)' }}>Emergency Mode</span>
                          <button
                            onClick={() => setEmergencySavingsMode(!emergencySavingsMode)}
                            style={{
                              width: '46px', height: '24px', borderRadius: '99px',
                              background: emergencySavingsMode ? '#22c55e' : 'rgba(255,255,255,0.1)',
                              border: 'none', position: 'relative', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', padding: '0 3px',
                              transition: 'background 0.3s'
                            }}
                          >
                            <motion.div
                              animate={{ x: emergencySavingsMode ? '22px' : '0px' }}
                              style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white' }}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Area Trajectory Chart */}
                      <div style={{
                        height: '180px',
                        background: 'rgba(3, 4, 10, 0.4)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '24px 16px 8px 16px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '12px',
                        position: 'relative'
                      }}>
                        {/* Horizontal guidelines */}
                        {[25, 50, 75].map(g => (
                          <div key={g} style={{ position: 'absolute', bottom: `${g}%`, left: '10px', right: '10px', height: '1px', background: 'rgba(255,255,255,0.03)' }} />
                        ))}

                        {/* Animated bars */}
                        {(emergencySavingsMode ? [22, 35, 18, 45, 28, 50, 24] : [45, 75, 35, 95, 55, 100, 50]).map((h, idx) => (
                          <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                            <motion.div
                              animate={{ height: `${h}%` }}
                              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                              style={{
                                width: '100%',
                                background: emergencySavingsMode
                                  ? 'linear-gradient(to top, #22c55e, #10b981)'
                                  : 'linear-gradient(to top, #ef4444, #f43f5e)',
                                borderRadius: '6px 6px 0 0',
                                boxShadow: `0 0 10px ${emergencySavingsMode ? '#22c55e11' : '#ef444411'}`
                              }}
                            />
                            <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.35)' }}>
                              Day {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Analysis Text */}
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                        {emergencySavingsMode 
                          ? '✓ Emergency Savings mode cuts spending vectors down by 55%, reducing daily burn rate and extending runway.'
                          : '⚠️ Trajectory indicates aggressive burn rates. Toggle Emergency savings mode above to caps Zomato/Swiggy and transport metrics.'}
                      </p>
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────── */}
                  {/* WIDGET 3: BUDGET QUEST MILESTONES */}
                  {/* ──────────────────────────────────────────────────────── */}
                  {renderedWidget === 'quest' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, position: 'relative' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                            Budget Quests Board
                          </h3>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Checkoff quests to unlock XP milestones</span>
                        </div>

                        {/* Player XP Counter */}
                        <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Star size={14} fill="#c084fc" color="#c084fc" />
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 'bold', color: '#c084fc' }}>
                            {playerXp} / 400 XP
                          </span>
                        </div>
                      </div>

                      {/* Quest Items Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {questItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleQuestToggle(item.id)}
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: item.done ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '10px',
                              padding: '14px 18px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '20px', height: '20px', borderRadius: '4px',
                                border: item.done ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
                                background: item.done ? '#22c55e' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px'
                              }}>
                                {item.done && '✓'}
                              </div>
                              <span style={{ fontSize: '13.5px', color: item.done ? 'rgba(255,255,255,0.45)' : 'white', textDecoration: item.done ? 'line-through' : 'none' }}>
                                {item.label}
                              </span>
                            </div>

                            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: item.done ? '#22c55e' : '#a855f7', fontWeight: 700 }}>
                              {item.done ? 'QUEST MET' : `+${item.xp} XP`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                          <span>Saver Level 1 Milestone Progress</span>
                          <span>{Math.round(Math.min(100, (playerXp/400)*100))}%</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                          <motion.div animate={{ width: `${Math.min(100, (playerXp/400)*100)}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #22c55e)', borderRadius: '99px' }} />
                        </div>
                      </div>

                      {/* Milestone Unlock Overlay */}
                      <AnimatePresence>
                        {milestoneUnlocked && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                              position: 'absolute', inset: 0, background: 'rgba(10, 12, 22, 0.96)', borderRadius: '12px',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 100,
                              padding: '24px', border: '1.5px solid #eab308'
                            }}
                          >
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}>
                              <Star size={54} fill="#eab308" color="#eab308" />
                            </motion.div>
                            <div style={{ textAlign: 'center' }}>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: 'white' }}>Milestone Level Unlock!</h4>
                              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                                You checked off critical quests, saving ₹2,349 and hitting 400 XP. Savvy Saver badge added to your account!
                              </p>
                            </div>
                            <KiraButton variant="success" size="sm" onClick={() => { setMilestoneUnlocked(false); setPlayerXp(0); setQuestItems(x => x.map(z => ({ ...z, done: false }))); }}>
                              Play Again
                            </KiraButton>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────── */}
                  {/* WIDGET 4: EXPENSE GRAVITY SORT */}
                  {/* ──────────────────────────────────────────────────────── */}
                  {renderedWidget === 'gravity' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                            Expense Gravity Sort
                          </h3>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Click transaction bubbles to sort correctly</span>
                        </div>
                        <div style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle size={14} color="#06b6d4" />
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 'bold', color: '#06b6d4' }}>
                            Score: {gravityScore} XP
                          </span>
                        </div>
                      </div>

                      {/* Bubbles Sandbox Area */}
                      <div style={{
                        height: '210px',
                        background: 'rgba(3, 4, 10, 0.45)',
                        border: '1.5px dashed rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '16px'
                      }}>
                        {/* Upper bins */}
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1, border: '1.5px solid rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.04)', borderRadius: '10px', padding: '10px', textAlign: 'center', fontSize: '12px', color: '#22c55e', fontWeight: 700 }}>
                            Essential / Needs
                          </div>
                          <div style={{ flex: 1, border: '1.5px solid rgba(168, 85, 247, 0.2)', background: 'rgba(168, 85, 247, 0.04)', borderRadius: '10px', padding: '10px', textAlign: 'center', fontSize: '12px', color: '#a855f7', fontWeight: 700 }}>
                            Discretionary / Wants
                          </div>
                        </div>

                        {/* Floating elements */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', padding: '16px 0' }}>
                          <AnimatePresence>
                            {bubbles.filter(b => !b.sorted).map((b) => (
                              <motion.div
                                key={b.id}
                                whileHover={{ scale: 1.05 }}
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  borderRadius: '24px',
                                  padding: '8px 16px',
                                  fontSize: '12.5px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  gap: '8px',
                                  alignItems: 'center'
                                }}
                              >
                                <span style={{ color: 'white', fontWeight: 500 }}>{b.label}</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button onClick={() => handleBubbleSort(b.id, 'essential')} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e44', color: '#22c55e', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>Need</button>
                                  <button onClick={() => handleBubbleSort(b.id, 'discretionary')} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid #a855f744', color: '#a855f7', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>Want</button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {bubbles.filter(b => !b.sorted).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                              <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>✓ All transactions sorted correctly!</span>
                              <div style={{ marginTop: '10px' }}>
                                <KiraButton variant="secondary" size="sm" onClick={() => { setBubbles(b => b.map(x => ({ ...x, sorted: false }))); setGravityScore(0); }}>
                                  Sort Again
                                </KiraButton>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </GlassCard>

        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
