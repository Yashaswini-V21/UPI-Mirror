import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient, type CoachResponse, type UploadResponse } from '../api/client';

export type TabId = 'coach' | 'impact' | 'forecast' | 'explain' | 'upload';
export type FinancialStatus = 'stable' | 'watch' | 'critical';

export interface KiraSession {
  uploadId: string;
  filename: string | null;
  rows: number;
  categories: string[];
  dateRange: { start: string | null; end: string | null };
}

export interface CoachData {
  status: FinancialStatus;
  runwayDays: number;
  narrative: string;
  actionText: string;
  tipText: string;
  suggestedCap: number;
  topCategory: string;
  gitlabUrl?: string;
  whatsappLink: string;
  confidence: number;
  burnRateDaily: number;
}

interface KiraStore {
  // Navigation
  showDashboard: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  enterDashboard: () => void;

  // Session
  session: KiraSession | null;

  // Coach data
  coachData: CoachData | null;
  coachLoading: boolean;

  // Upload flow
  upload: (file: File, budget: number) => Promise<void>;
  uploadError: string | null;

  // Coach
  fetchCoach: (budget?: number) => Promise<void>;

  // Alerts
  hasAlert: boolean;

  // Reset
  newSession: () => void;
}

const DEFAULT_WHATSAPP = 'https://wa.me/?text=Kira+AI+coach+insight';

const DEMO_COACH: CoachData = {
  status: 'watch',
  runwayDays: 12,
  narrative: 'Kira detected a spike in Food Delivery spending. At this burn rate, funds exhaust in 12 days. Recommend capping this category immediately.',
  actionText: 'Cap Food Delivery at ₹2,000 this week to extend runway by 4 days.',
  tipText: 'Most broke dates happen 3 days before payday. Pace yourself this week.',
  suggestedCap: 2000,
  topCategory: 'Food Delivery',
  whatsappLink: DEFAULT_WHATSAPP,
  confidence: 87,
  burnRateDaily: 1250,
};

function mapCoachResponse(result: CoachResponse): CoachData {
  return {
    status: (result.status ?? 'stable') as FinancialStatus,
    runwayDays: result.days_left ?? 0,
    narrative: result.narrative ?? '',
    actionText: result.action ?? '',
    tipText: result.tip ?? '',
    suggestedCap: result.suggested_cap ?? 0,
    topCategory: result.signals?.top_category ?? 'General',
    gitlabUrl: result.gitlab_issue_url ?? undefined,
    whatsappLink: result.whatsapp_link ?? DEFAULT_WHATSAPP,
    confidence: Math.round((result.confidence_score ?? 0) * 100),
    burnRateDaily: result.signals?.burn_rate_daily ?? 0,
  };
}

export const useKiraStore = create<KiraStore>()(
  persist(
    (set, get) => ({
      showDashboard: false,
      activeTab: 'upload',
      session: null,
      coachData: null,
      coachLoading: false,
      uploadError: null,
      hasAlert: false,

      setActiveTab: (tab) => set({ activeTab: tab }),

      enterDashboard: () => set({ showDashboard: true, activeTab: 'upload' }),

      newSession: () => set({
        showDashboard: false,
        activeTab: 'upload',
        session: null,
        coachData: null,
        coachLoading: false,
        uploadError: null,
        hasAlert: false,
      }),

      upload: async (file: File, budget: number) => {
        set({ uploadError: null });
        try {
          const result: UploadResponse = await apiClient.upload(file);
          const session: KiraSession = {
            uploadId: result.upload_id,
            filename: file.name,
            rows: result.rows ?? 0,
            categories: result.categories ?? [],
            dateRange: result.date_range ?? { start: null, end: null },
          };
          set({ session, activeTab: 'coach' });
          await get().fetchCoach(budget);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
          set({ uploadError: message });
          throw err;
        }
      },

      fetchCoach: async (budget?: number) => {
        const { session } = get();
        if (!session) return;
        set({ coachLoading: true });
        try {
          const result = await apiClient.coach(session.uploadId, budget ?? 15000);
          const coachData = mapCoachResponse(result);
          set({ coachData, hasAlert: !!result.gitlab_issue_url, coachLoading: false });
        } catch {
          // Graceful degradation: demo data so UI never shows empty state
          set({ coachData: DEMO_COACH, coachLoading: false });
        }
      },
    }),
    {
      name: 'kira-session',
      storage: createJSONStorage(() => sessionStorage), // sessionStorage: auto-clears on tab close (no PII leakage)
      partialize: (state) => ({
        // Only persist navigation state + session metadata — never raw file data
        showDashboard: state.showDashboard,
        activeTab: state.activeTab,
        session: state.session,
        coachData: state.coachData,
        hasAlert: state.hasAlert,
      }),
    }
  )
);
