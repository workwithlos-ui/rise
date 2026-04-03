import Anthropic from '@anthropic-ai/sdk';
import { getSharedContext, getLatestMetrics } from '@/lib/supabase';

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  try {
    const [ctx, metrics] = await Promise.all([
      getSharedContext(),
      getLatestMetrics(2),
    ]);
    const current = metrics[0] ?? null;
    const previous = metrics[1] ?? null;

    if (!current) {
      return Response.json(
        { error: 'No metrics found. Add metrics via /setup first.' },
        { status: 400 }
      );
    }

    const changes: string[] = [];
    if (previous) {
      const fields = [
        'monthly_revenue',
        'customer_cac',
        'monthly_churn_rate',
        'pipeline_value',
        'close_rate',
      ] as const;
      for (const f of fields) {
        const curr = current[f as keyof typeof current] as number;
        const prev = previous[f as keyof typeof previous] as number;
        if (curr && prev) {
          const pct = (((curr - prev) / prev) * 100).toFixed(1);
          const dir = curr > prev ? 'up' : 'down';
          changes.push(
            `${f}: ${prev} -> ${curr} (${dir} ${Math.abs(parseFloat(pct))}%)`
          );
        }
      }
    }

    // Map DB column names to readable labels for the prompt
    const readableMetrics = {
      monthly_revenue: current.monthly_revenue,
      ad_spend: current.monthly_ad_spend,
      ltv: current.customer_ltv,
      cac: current.customer_cac,
      churn_rate: current.monthly_churn_rate,
      pipeline_value: current.pipeline_value,
      close_rate: current.close_rate,
      avg_deal_size: current.avg_deal_size,
    };

    // Read GRIP weights from shared context (stored as spcl_weights column)
    const gripWeights = ctx?.spcl_weights ?? {};

    const prompt = `You are RISE, an AI revenue analyst. Analyze this week's business performance.

BUSINESS CONTEXT: ${JSON.stringify(ctx ?? {}, null, 2)}

GRIP SCORING WEIGHTS (Gravity, Reach, Impact, Proof): ${JSON.stringify(gripWeights, null, 2)}

CURRENT PERIOD METRICS:
${JSON.stringify(readableMetrics, null, 2)}

${
  previous
    ? `PREVIOUS PERIOD METRICS:\n${JSON.stringify(
        {
          monthly_revenue: previous.monthly_revenue,
          ad_spend: previous.monthly_ad_spend,
          ltv: previous.customer_ltv,
          cac: previous.customer_cac,
          churn_rate: previous.monthly_churn_rate,
          pipeline_value: previous.pipeline_value,
          close_rate: previous.close_rate,
          avg_deal_size: previous.avg_deal_size,
        },
        null,
        2
      )}`
    : 'No previous period.'
}

${changes.length ? `PERIOD-OVER-PERIOD CHANGES:\n${changes.join('\n')}` : ''}

Generate a comprehensive weekly intelligence report. Reference the shared business context (ICPs, proof bank, offers) when making recommendations.
Use GRIP scoring (Gravity, Reach, Impact, Proof) to prioritize insights.
Show specific dollar math for every insight. No generic advice.
Do not use em dashes anywhere in your response. Use hyphens or commas instead.

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    try {
      const completion = await anthropic.messages.create(
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const raw =
        completion.content[0].type === 'text'
          ? completion.content[0].text
          : '{}';
      const clean = raw
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const report = JSON.parse(clean);

      // Strip any em dashes from the report
      const sanitized = JSON.parse(
        JSON.stringify(report).replace(/\u2014/g, '-').replace(/\u2013/g, '-')
      );

      return Response.json({
        success: true,
        report: sanitized,
        generated_at: new Date().toISOString(),
      });
    } catch (abortError) {
      clearTimeout(timeout);
      if (
        abortError instanceof Error &&
        abortError.name === 'AbortError'
      ) {
        return Response.json(
          { error: 'Report generation timed out. Please try again.' },
          { status: 504 }
        );
      }
      throw abortError;
    }
  } catch (error) {
    console.error('[weekly-report]', error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate report',
      },
      { status: 500 }
    );
  }
}
