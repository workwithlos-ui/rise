import Anthropic from '@anthropic-ai/sdk';
import { getSharedContext, getLatestMetrics } from '@/lib/supabase';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  try {
    const [ctx, metrics] = await Promise.all([getSharedContext(), getLatestMetrics(2)]);
    const current = metrics[0] ?? null;
    const previous = metrics[1] ?? null;

    if (!current) return Response.json({ error: 'No metrics found. Add metrics via /setup first.' }, { status: 400 });

    const changes: string[] = [];
    if (previous) {
      const fields = ['monthly_revenue', 'cac', 'churn_rate', 'pipeline_value', 'close_rate'] as const;
      for (const f of fields) {
        const curr = current[f as keyof typeof current] as number;
        const prev = previous[f as keyof typeof previous] as number;
        if (curr && prev) {
          const pct = (((curr - prev) / prev) * 100).toFixed(1);
          const dir = curr > prev ? 'up' : 'down';
          changes.push(`${f}: ${prev} → ${curr} (${dir} ${Math.abs(parseFloat(pct))}%)`);
        }
      }
    }

    const prompt = `You are RISE, an AI revenue analyst. Analyze this week's business performance.

BUSINESS CONTEXT: ${JSON.stringify(ctx ?? {}, null, 2)}

CURRENT PERIOD METRICS:
${JSON.stringify(current, null, 2)}

${previous ? `PREVIOUS PERIOD METRICS:\n${JSON.stringify(previous, null, 2)}` : 'No previous period.'}

${changes.length ? `PERIOD-OVER-PERIOD CHANGES:\n${changes.join('\n')}` : ''}

Generate a comprehensive weekly intelligence report. Reference the shared business context (ICPs, proof bank, offers) when making recommendations.
Show specific dollar math for every insight. No generic advice.

Return ONLY valid JSON:
{
  "period": "Week of [current date]",
  "headline": "One sentence capturing the most important insight this week",
  "summary": "3-4 sentences executive overview with specific numbers",
  "top_metric_changes": [{"metric":"string","change":"string","direction":"up|down|flat","significance":"why this matters in dollar terms"}],
  "key_insights": ["insight 1 with math","insight 2","insight 3","insight 4"],
  "recommended_actions": [{"priority":1,"action":"specific action","expected_outcome":"specific outcome with number","timeline":"X days"}],
  "risks": ["specific risk with dollar estimate","risk 2"],
  "opportunities": ["specific opportunity with dollar estimate","opp 2"]
}`;

    const completion = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const report = JSON.parse(clean);

    return Response.json({ success: true, report, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error('[weekly-report]', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
