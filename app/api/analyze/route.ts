import Anthropic from '@anthropic-ai/sdk';
import { getSharedContext, getLatestMetrics } from '@/lib/supabase';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BENCHMARKS: Record<string, Record<string, number>> = {
  'Agency / Services': { margin: 28, cac: 450, ltv: 8400, churn: 5, close_rate: 22 },
  'SaaS / Software': { margin: 72, cac: 890, ltv: 14000, churn: 3, close_rate: 18 },
  'E-commerce / DTC': { margin: 38, cac: 67, ltv: 420, churn: 8, close_rate: 35 },
  'Coaching / Consulting': { margin: 65, cac: 300, ltv: 6000, churn: 6, close_rate: 28 },
  'Home Services': { margin: 35, cac: 120, ltv: 1800, churn: 12, close_rate: 40 },
};

export async function POST(req: Request) {
  try {
    const { question, industry = 'Agency / Services', mode = 'insights' } = await req.json() as {
      question?: string; industry?: string; mode?: 'insights' | 'deep';
    };

    const [ctx, metricsArr] = await Promise.all([getSharedContext(), getLatestMetrics(2)]);
    const current = metricsArr[0] ?? null;
    const previous = metricsArr[1] ?? null;
    const benchmarks = BENCHMARKS[industry] ?? BENCHMARKS['Agency / Services'];

    const ctxBlock = ctx ? `
BUSINESS CONTEXT (from shared_context table):
${JSON.stringify(ctx, null, 2)}
` : 'No shared context loaded.';

    const metricsBlock = current ? `
CURRENT METRICS (latest entry):
Monthly Revenue: $${current.monthly_revenue?.toLocaleString() ?? 'N/A'}
Ad Spend: $${current.ad_spend?.toLocaleString() ?? 'N/A'}
LTV: $${current.ltv?.toLocaleString() ?? 'N/A'}
CAC: $${current.cac?.toLocaleString() ?? 'N/A'}
Churn Rate: ${current.churn_rate ?? 'N/A'}%
Pipeline Value: $${current.pipeline_value?.toLocaleString() ?? 'N/A'}
Close Rate: ${current.close_rate ?? 'N/A'}%
Avg Deal Size: $${current.avg_deal_size?.toLocaleString() ?? 'N/A'}
${previous ? `
PREVIOUS PERIOD METRICS:
Monthly Revenue: $${previous.monthly_revenue?.toLocaleString() ?? 'N/A'}
CAC: $${previous.cac?.toLocaleString() ?? 'N/A'}
Churn: ${previous.churn_rate ?? 'N/A'}%
Pipeline: $${previous.pipeline_value?.toLocaleString() ?? 'N/A'}
` : 'No previous period data.'}
` : 'No metrics available. User should add metrics via /setup.';

    const benchmarkBlock = `
INDUSTRY BENCHMARKS (${industry}):
Margin: ${benchmarks.margin}% | CAC: $${benchmarks.cac} | LTV: $${benchmarks.ltv}
Churn: ${benchmarks.churn}% | Close Rate: ${benchmarks.close_rate}%
`;

    const systemPrompt = `You are RISE, an elite AI revenue intelligence analyst. You have studied 10,000 growth-stage companies.
You know this business's ICPs, proof bank, offers, and voice from shared_context. You run math on THEIR specific numbers, not generic advice.
When you flag an anomaly, you reference which ICP segment is most affected and which proof-bank result is relevant.
Never give advice that ignores the shared context. Every insight must show the dollar impact.
No em dashes. No generic startup language. Return ONLY valid JSON.`;

    const userPrompt = mode === 'deep'
      ? `${ctxBlock}\n${metricsBlock}\n${benchmarkBlock}\n\nQUESTION: ${question ?? 'Give me a full growth analysis'}\n\nReturn JSON: {"headline":"string","analysis":"string (500+ words, specific dollar math, no generic advice)","action_plan":["action 1","action 2","action 3","action 4","action 5"],"risks":["risk 1","risk 2"],"opportunities":["opp 1","opp 2"]}`
      : `${ctxBlock}\n${metricsBlock}\n${benchmarkBlock}\n\nGenerate 4-6 intelligence insights. For each, identify anomalies, gaps vs benchmarks, and connect to ICP context from shared_context.\n\nReturn JSON array: [{"severity":"CRITICAL|WARNING|OPPORTUNITY|INFO","title":"string","body":"2-3 sentences with specific numbers and dollar impact","action":"one specific action with expected outcome","metric":"which metric","value":"current value","benchmark":"industry benchmark value"}]`;

    const model = mode === 'deep' ? 'claude-opus-4-5' : 'claude-sonnet-4-20250514';
    const completion = await anthropic.messages.create({
      model,
      max_tokens: mode === 'deep' ? 2500 : 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = completion.content[0].type === 'text' ? completion.content[0].text : '[]';
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(clean);

    return Response.json({ success: true, data: result, mode, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[analyze]', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Analysis failed' }, { status: 500 });
  }
}
