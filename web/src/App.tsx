import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { LandingScreen } from './components/LandingScreen';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { TopNav } from './components/TopNav';
import { CoachTab } from './components/tabs/CoachTab';
import { ExplainTab } from './components/tabs/ExplainTab';
import { ForecastTab } from './components/tabs/ForecastTab';
import { ImpactTab } from './components/tabs/ImpactTab';
import { UploadTab } from './components/tabs/UploadTab';
import { ErrorBoundary } from './components/ErrorBoundary';
import { KiraSkeleton } from './components/ui';
import { useKiraStore } from './store/useKiraStore';

// ── Tab-level loading fallback ────────────────────────────────────────────────
const TabSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
    <KiraSkeleton height={130} variant="card" />
    <KiraSkeleton height={200} variant="card" />
    <KiraSkeleton height={80}  variant="card" />
  </div>
);

function App() {
  const { showDashboard, activeTab, enterDashboard, newSession } = useKiraStore();

  return (
    <>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000, style: { background: 'transparent', boxShadow: 'none', padding: 0 } }}
      />

      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-base, #03040a)', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {!showDashboard ? (
            /* ── LANDING ─────────────────────────────────────────────────── */
            <motion.div
              key="landing"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -24, filter: 'blur(8px)', transition: { duration: 0.55, ease: 'easeInOut' } }}
              style={{ width: '100%', height: '100%', overflowY: 'auto' }}
            >
              <ErrorBoundary>
                <LandingScreen onStart={enterDashboard} />
              </ErrorBoundary>
            </motion.div>

          ) : (
            /* ── DASHBOARD ───────────────────────────────────────────────── */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ display: 'flex', width: '100%', height: '100%' }}
            >
              {/* Desktop sidebar */}
              <div className="desktop-only" style={{ height: '100%', flexShrink: 0 }}>
                <ErrorBoundary>
                  <Sidebar onNewSession={newSession} />
                </ErrorBoundary>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                <ErrorBoundary>
                  <TopNav />
                </ErrorBoundary>

                {/* Main scrollable content */}
                <main
                  id="main-content"
                  tabIndex={-1}
                  aria-label="Dashboard content"
                  style={{ flex: 1, overflowY: 'auto', padding: '2rem', paddingBottom: '80px' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      style={{ maxWidth: '900px', margin: '0 auto' }}
                    >
                      <ErrorBoundary>
                        <Suspense fallback={<TabSkeleton />}>
                          {activeTab === 'coach'    && <CoachTab />}
                          {activeTab === 'impact'   && <ImpactTab />}
                          {activeTab === 'forecast' && <ForecastTab />}
                          {activeTab === 'explain'  && <ExplainTab />}
                          {activeTab === 'upload'   && <UploadTab />}
                        </Suspense>
                      </ErrorBoundary>
                    </motion.div>
                  </AnimatePresence>
                </main>

                {/* Mobile tab bar */}
                <div className="mobile-only" style={{ flexShrink: 0 }}>
                  <ErrorBoundary>
                    <TabBar />
                  </ErrorBoundary>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive utility classes */}
        <style>{`
          @media (max-width: 768px) {
            .desktop-only { display: none !important; }
            .mobile-only  { display: block; }
          }
          @media (min-width: 769px) {
            .mobile-only  { display: none !important; }
            .desktop-only { display: block; }
          }
        `}</style>
      </div>
    </>
  );
}

export default App;
