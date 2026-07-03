import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, KiraButton, KiraInput, StatusBadge } from '../ui';
import { UploadCloudIcon, CheckCircleIcon, SparklesIcon } from '../ui/Icons';
import { useKiraStore } from '../../store/useKiraStore';
import toast from 'react-hot-toast';

type UploadState = 'idle' | 'dragover' | 'uploading' | 'success' | 'error';

const ALLOWED_TYPES = ['text/csv', 'application/pdf', 'text/plain'];
const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const formatBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const truncate = (name: string, max: number) =>
  name.length <= max ? name : `${name.slice(0, max - 3)}…`;

export const UploadTab: React.FC = () => {
  const { upload, session, uploadError, setActiveTab, loadDemoSession } = useKiraStore();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [file, setFile]   = useState<File | null>(null);
  const [budgetRaw, setBudgetRaw]   = useState('15000');
  const [budgetError, setBudgetError] = useState('');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadId = `kira-file-drop-${Date.now()}`;

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type) && !f.name.endsWith('.csv') && !f.name.endsWith('.pdf')) {
      return 'Only CSV and PDF files are supported.';
    }
    if (f.size > MAX_BYTES) return `File too large. Max ${MAX_MB} MB.`;
    return null;
  };

  const processFile = useCallback(async (f: File) => {
    const err = validateFile(f);
    if (err) {
      toast.error(err);
      setUploadState('error');
      return;
    }
    setFile(f);
    setUploadState('uploading');
    setProgress(0);

    // Simulate progress while API is in flight
    const progressInterval = setInterval(() => {
      setProgress(p => p < 85 ? p + Math.random() * 12 : p);
    }, 200);

    const budget = parseInt(budgetRaw.replace(/[^\d]/g, ''), 10);
    if (!budget || budget < 0) {
      setBudgetError('Enter a valid budget');
      clearInterval(progressInterval);
      setUploadState('error');
      return;
    }

    try {
      await upload(f, budget);
      clearInterval(progressInterval);
      setProgress(100);
      setUploadState('success');
      toast.success('Upload analysed successfully!');
    } catch (e: unknown) {
      clearInterval(progressInterval);
      const message = e instanceof Error ? e.message : 'Upload failed.';
      toast.error(message);
      setUploadState('error');
    }
  }, [upload, budgetRaw]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadState('idle');
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) processFile(picked);
    e.target.value = '';
  }, [processFile]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudgetRaw(e.target.value);
    setBudgetError('');
  };

  const handleBudgetBlur = () => {
    const num = parseInt(budgetRaw.replace(/[^\d]/g, ''), 10);
    if (isNaN(num) || num <= 0) {
      setBudgetError('Enter a valid budget');
    } else {
      setBudgetRaw(num.toLocaleString('en-IN'));
      setBudgetError('');
    }
  };

  const isDragOver  = uploadState === 'dragover';
  const isUploading = uploadState === 'uploading';
  const isSuccess   = uploadState === 'success';
  const isError     = uploadState === 'error';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* BUDGET INPUT */}
      <GlassCard>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.1em' }}>
          Set Monthly Budget
        </div>
        <KiraInput
          label="Monthly Budget (₹)"
          prefixContent={<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>₹</span>}
          value={budgetRaw}
          onChange={handleBudgetChange}
          onBlur={handleBudgetBlur}
          error={budgetError}
          helperText="Kira uses this to compute your runway and suggest caps."
          inputMode="numeric"
          aria-label="Monthly budget in Indian Rupees"
        />
      </GlassCard>

      {/* DROP ZONE */}
      <input
        ref={inputRef}
        id={uploadId}
        type="file"
        accept=".csv,.pdf,text/csv,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Upload spending statement"
      />

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <GlassCard accent="green" glow>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px 0' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                  <CheckCircleIcon size={64} color="#22c55e" />
                </motion.div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '18px', color: 'white', marginBottom: '6px' }}>Analysis Complete</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    {truncate(file?.name ?? '', 30)} · {file ? formatBytes(file.size) : ''}
                  </div>
                  {session && (
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(34,197,94,0.6)', marginTop: '8px' }}>
                      Session ID: {session.uploadId}
                    </div>
                  )}
                </div>
                <StatusBadge status="stable" size="sm" />
                <KiraButton
                  variant="success"
                  size="md"
                  onClick={() => setActiveTab('coach')}
                  aria-label="View coaching analysis"
                >
                  View Coaching Analysis →
                </KiraButton>
              </div>
            </GlassCard>
          </motion.div>

        ) : isUploading ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '32px 0' }}>
                {/* Custom spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  aria-hidden="true"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#a855f7', borderRightColor: '#3b82f6' }}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '6px' }}>
                    {truncate(file?.name ?? 'Processing…', 28)}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Analysing…</div>
                </div>
                {/* Progress bar */}
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Upload progress: ${Math.round(progress)}%`}
                  style={{ width: '100%', maxWidth: '300px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}
                >
                  <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #3b82f6)', borderRadius: '99px' }} />
                </div>
              </div>
            </GlassCard>
          </motion.div>

        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              onDragOver={e => { e.preventDefault(); setUploadState('dragover'); }}
              onDragLeave={() => setUploadState('idle')}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              animate={!isDragOver ? {
                scale: [1, 1.006, 1],
                transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
              } : {}}
              whileHover={{ scale: 1.008 }}
              style={{
                width: '100%', height: '220px',
                border: isDragOver ? '2px solid var(--green-500, #22c55e)' : '1.5px dashed rgba(157,122,255,0.25)',
                background: isDragOver ? 'rgba(34,197,94,0.06)' : 'rgba(157,122,255,0.03)',
                borderRadius: 'var(--r-xl, 16px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
                boxShadow: isDragOver ? '0 0 40px rgba(34,197,94,0.15)' : 'none',
                outline: 'none',
              }}
              tabIndex={0}
              role="button"
              aria-label="Click or drag and drop your CSV or PDF spending statement here"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
            >
              <AnimatePresence mode="wait">
                {isDragOver ? (
                  <motion.div key="dragover" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <CheckCircleIcon size={40} color="#22c55e" />
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '16px', color: '#22c55e' }}>Drop it here ✓</span>
                  </motion.div>
                ) : isError ? (
                  <motion.div key="error" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <UploadCloudIcon size={40} color="#ef4444" />
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '14px', color: '#ef4444' }}>{uploadError || 'Upload failed — try again'}</span>
                    <KiraButton variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setUploadState('idle'); }}>
                      Try again
                    </KiraButton>
                  </motion.div>
                ) : (
                  <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <UploadCloudIcon size={40} color="rgba(255,255,255,0.25)" />
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>Drop your statement</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                      CSV or PDF · Google Pay · Paytm · PhonePe
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {['.CSV', '.PDF'].map(ext => (
                        <span key={ext} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {ext}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEMO SESSION EXPLORER */}
      {!isSuccess && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 20px', border: '1.5px dashed rgba(168, 85, 247, 0.28)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.03), rgba(99, 102, 241, 0.01))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SparklesIcon size={16} color="#c084fc" />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: 'white' }}>Don't have a statement?</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0, textAlign: 'center', lineHeight: 1.5, maxWidth: '340px', fontFamily: 'Outfit, sans-serif' }}>
              Explore the entire Kira-AI coach dashboard instantly with our pre-loaded sample budget and transaction telemetry.
            </p>
            <KiraButton
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); loadDemoSession(); }}
              style={{ borderColor: 'rgba(168, 85, 247, 0.45)', color: '#c084fc', marginTop: '6px' }}
            >
              Load Sandbox Demo Data →
            </KiraButton>
          </GlassCard>
        </motion.div>
      )}

      {/* RECENT SESSION SUMMARY */}
      {session && !isSuccess && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard accent="blue" padding="sm">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.1em' }}>Last Upload</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500, color: 'white', fontSize: '13px' }}>
                  {session.filename ? truncate(session.filename, 28) : 'Unknown file'}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                  {session.rows} transactions · {session.categories.slice(0, 3).join(', ')}{session.categories.length > 3 ? `…` : ''}
                </div>
              </div>
              <KiraButton variant="ghost" size="sm" onClick={() => setActiveTab('coach')}>View Coach</KiraButton>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};
