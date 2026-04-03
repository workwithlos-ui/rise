import { getMetricsHistory, saveMetrics } from '@/lib/supabase';

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
    const body = await req.json();

    if (!body.monthly_revenue) {
      return Response.json({ error: 'monthly_revenue is required' }, { status: 400 });
    }

    // Map frontend field names to actual DB column names
    const payload: Record<string, number | string | null> = {
      monthly_revenue: parseFloat(body.monthly_revenue) || null,
      monthly_ad_spend: parseFloat(body.monthly_ad_spend) || null,
      customer_ltv: parseFloat(body.customer_ltv) || null,
      customer_cac: parseFloat(body.customer_cac) || null,
      monthly_churn_rate: parseFloat(body.monthly_churn_rate) || null,
      pipeline_value: parseFloat(body.pipeline_value) || null,
      close_rate: parseFloat(body.close_rate) || null,
      avg_deal_size: parseFloat(body.avg_deal_size) || null,
      notes: body.notes || null,
      context_key: 'default',
    };

    const saved = await saveMetrics(payload);
    return Response.json({ success: true, metrics: saved });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save';
    if (msg.includes('does not exist') || msg.includes('42P01')) {
      return Response.json(
        {
          error:
            'rise_metrics table not found. Create it in Supabase with columns: id serial, context_key text, monthly_revenue numeric, monthly_ad_spend numeric, customer_ltv numeric, customer_cac numeric, monthly_churn_rate numeric, pipeline_value numeric, close_rate numeric, avg_deal_size numeric, snapshot_date date, created_at timestamptz, notes text',
        },
        { status: 500 }
      );
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
