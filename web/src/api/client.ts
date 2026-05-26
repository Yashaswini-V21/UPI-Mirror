/** Kira-AI API client — typed, with error handling and auth header injection. */

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const API_TOKEN: string = import.meta.env.VITE_API_TOKEN ?? '';

// ─── Internal fetch wrapper ───────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch (networkErr) {
    throw new Error('Network error — is the Kira backend running?');
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail ?? body?.error ?? detail;
    } catch { /* ignore parse errors */ }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

// ─── Response Types ────────────────────────────────────────────────────────────

export interface UploadResponse {
  upload_id: string;
  rows: number;
  categories: string[];
  date_range: { start: string | null; end: string | null };
  source: string;
}

export interface SignalData {
  anomaly_detected: boolean;
  habit_score: number;
  days_left: number;
  regret_flag: boolean;
  top_category: string;
  burn_rate_daily: number;
  suggested_cap: number;
  confidence_score: number;
}

export interface CoachResponse {
  upload_id: string;
  status: string;
  days_left: number;
  narrative: string;
  action: string;
  urgency: string;
  tip: string;
  suggested_cap: number;
  nudge: string;
  signals: SignalData;
  gitlab_issue_url: string | null;
  whatsapp_link: string;
  confidence_score: number;
}

export interface MetricsResponse {
  forecast_mae: number;
  signal_coverage: number;
  nudge_acceptance: number;
  overall_score: number;
  total_sessions: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime_seconds: number;
  gemini_connected: boolean;
  gitlab_connected: boolean;
}

export interface ScenarioRequest {
  upload_id: string;
  budget: number;
  cut_percent: number;
}

// ─── API Client ────────────────────────────────────────────────────────────────

export const apiClient = {
  health: (): Promise<HealthResponse> =>
    request<HealthResponse>('/health'),

  upload: async (file: File): Promise<UploadResponse> => {
    const form = new FormData();
    form.append('file', file);
    return request<UploadResponse>('/upload', { method: 'POST', body: form });
  },

  coach: (uploadId: string, budget: number = 15000): Promise<CoachResponse> =>
    request<CoachResponse>(`/coach/${uploadId}?budget=${budget}`),

  metrics: (): Promise<MetricsResponse> =>
    request<MetricsResponse>('/metrics'),

  scenario: (body: ScenarioRequest): Promise<CoachResponse> =>
    request<CoachResponse>('/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  feedback: (uploadId: string, nudgeId: string, accepted: boolean): Promise<void> =>
    request<void>('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upload_id: uploadId, nudge_id: nudgeId, accepted }),
    }),

  deleteSession: (uploadId: string): Promise<void> =>
    request<void>(`/sessions/${uploadId}`, { method: 'DELETE' }),
};
