import { getMetricsHistory, saveMetrics } from '@/lib/supabase';
import type { Metrics } from '@/lib/types';

export async function GET() {
  try {
    const metrics = await getMetricsHistory(12);
    return Response.json({ success: true, metrics });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Metrics;
    const required = ['monthly_revenue'];
    for (const field of required) {
      if (!body[field as keyof Metrics]) {
        return Response.json({ error: `${field} is required` }, { status: 400 });
      }
    }
    const saved = await saveMetrics(body as unknown as Record<string, number | string | undefined>);
    return Response.json({ success: true, metrics: saved });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save';
    if (msg.includes('does not exist') || msg.includes('42P01')) {
      return Response.json({
        error: 'rise_metrics table not found. Run this SQL in Supabase: CREATE TABLE rise_metrics (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, created_at timestamptz DEFAULT now(), period_label text, monthly_revenue numeric, ad_spend numeric, ltv numeric, cac numeric, churn_rate numeric, pipeline_value numeric, close_rate numeric, avg_deal_size numeric, notes text);',
      }, { status: 500 });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
