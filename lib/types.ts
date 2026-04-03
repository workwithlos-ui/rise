export interface Metrics {
  id?: number;
  context_key?: string;
  monthly_revenue: number | null;
  monthly_ad_spend?: number | null;
  customer_ltv?: number | null;
  customer_cac?: number | null;
  monthly_churn_rate?: number | null;
  pipeline_value?: number | null;
  close_rate?: number | null;
  avg_deal_size?: number | null;
  snapshot_date?: string;
  created_at?: string;
  notes?: string | null;
}

export type Severity = 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'INFO';

export interface Insight {
  id: string;
  severity: Severity;
  title: string;
  body: string;
  action: string;
  metric?: string;
  value?: string;
  benchmark?: string;
  created_at: string;
}

export interface GRIPWeights {
  gravity?: number;
  reach?: number;
  impact?: number;
  proof?: number;
  [key: string]: number | undefined;
}

export interface SharedContext {
  id?: number;
  context_key?: string;
  business?: Record<string, string | number>;
  audiences?: Array<{ name: string; pain_points: string[]; goals: string[] }>;
  proof_bank?: Array<{ id: string; type: string; client: string; metric: string; summary: string; strength: number }>;
  voice?: Record<string, unknown>;
  platform_specs?: Record<string, unknown>;
  spcl_weights?: Record<string, number>;
  offers?: Array<{ id: string; name: string; desc: string; setup: number; monthly: number }>;
  constraints?: string[];
  updated_at?: string;
  created_at?: string;
}

export interface WeeklyReport {
  period: string;
  headline: string;
  summary: string;
  top_metric_changes: Array<{ metric: string; change: string; direction: 'up' | 'down' | 'flat'; significance: string }>;
  key_insights: string[];
  recommended_actions: Array<{ priority: number; action: string; expected_outcome: string; timeline: string }>;
  risks: string[];
  opportunities: string[];
}
