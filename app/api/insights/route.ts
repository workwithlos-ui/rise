import { NextRequest } from 'next/server';

// In-memory store for insights (persists across requests in the same serverless instance)
// This is a lightweight approach since we cannot create new Supabase tables without admin access.
// For production, this should be backed by a database table.

let insightsStore: Array<{
  id: string;
  severity: string;
  title: string;
  body: string;
  action: string;
  metric?: string;
  value?: string;
  benchmark?: string;
  created_at: string;
  source: string;
}> = [];

export async function GET() {
  return Response.json({ success: true, insights: insightsStore });
}

export async function POST(req: NextRequest) {
  try {
    const { insights, source = 'dashboard' } = await req.json();

    if (!Array.isArray(insights)) {
      return Response.json({ error: 'insights must be an array' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newInsights = insights.map(
      (item: Record<string, string>, i: number) => ({
        id: `insight-${Date.now()}-${i}`,
        severity: item.severity ?? 'INFO',
        title: item.title ?? '',
        body: (item.body ?? '').replace(/\u2014/g, '-').replace(/\u2013/g, '-'),
        action: (item.action ?? '').replace(/\u2014/g, '-').replace(/\u2013/g, '-'),
        metric: item.metric,
        value: item.value,
        benchmark: item.benchmark,
        created_at: now,
        source,
      })
    );

    // Prepend new insights (newest first), keep max 50
    insightsStore = [...newInsights, ...insightsStore].slice(0, 50);

    return Response.json({ success: true, count: newInsights.length });
  } catch (error) {
    console.error('[insights]', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to save insights' },
      { status: 500 }
    );
  }
}
