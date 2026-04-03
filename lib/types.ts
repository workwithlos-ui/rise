export interface Metrics {
  id?: string;
  created_at?: string;
  period_label?: string;
  monthly_revenue: number;
  ad_spend?: number;
  ltv?: number;
  cac?: number;
  churn_rate?: number;
  pipeline_value?: number;
  close_rate?: number;
  avg_deal_size?: number;
  notes?: string;
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

export interface SharedContext {
  business_info?: Record<string, string>;
  audiences?: Array<{ name: string; pain_points: string[]; goals: string[] }>;
  proof_bank?: Array<{ result: string; client?: string; metric?: string }>;
  voice?: { tone: string; rules: string[] };
  offers?: Array<{ name: string; price: string; description: string }>;
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
