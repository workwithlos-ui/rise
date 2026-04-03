'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Zap, BarChart3, RefreshCw, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import type { Metrics, Insight } from '@/lib/types';

const T = {
  bg: '#050505', surface: '#111111', border: '#1a1a1a', accent: '#c8f542',
  accentDim: '#c8f54214', red: '#ff4444', amber: '#f5a623', green: '#22c55e',
  text: '#ffffff', sub: '#6b6b6b', dim: '#333333',
};

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/feed', label: 'Feed' },
  { href: '/report', label: 'Report' },
  { href: '/setup', label: 'Setup' },
];

function sevColor(s: string) {
  if (s === 'CRITICAL') return T.red;
  if (s === 'WARNING') return T.amber;
  if (s === 'OPPORTUNITY') return T.accent;
  return T.sub;
}

function MetricCard({ label, value, prev, unit = '$' }: { label: string; value?: number | null; prev?: number | null; unit?: string }) {
  const hasChange = value !== undefined && value !== null && prev !== undefined && prev !== null && prev !== 0;
  const pct = hasChange ? (((value! - prev!) / prev!) * 100) : 0;
  const up = pct >= 0;
  const fmt = (n: number) => unit === '$' ? `$${n.toLocaleString()}` : unit === '%' ? `${n}%` : `${n.toLocaleString()}`;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
      <p style={{ fontSize: 9, color: T.sub, letterSpacing: '0.12em', fontFamily: 'DM Mono, monospace', marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: T.text, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
        {value !== undefined && value !== null ? fmt(value) : '--'}
      </p>
      {hasChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          {up ? <TrendingUp size={11} style={{ color: T.green }} /> : <TrendingDown size={11} style={{ color: T.red }} />}
          <span style={{ fontSize: 11, color: up ? T.green : T.red, fontFamily: 'DM Mono, monospace' }}>
            {up ? '+' : ''}{pct.toFixed(1)}% vs prev
          </span>
        </div>
      )}
    </motion.div>
  );
}

function InsightCard({ insight, i }: { insight: Insight; i: number }) {
  const color = sevColor(insight.severity);
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
      style={{ background: T.surface, border: `1px solid ${color}30`, borderRadius: 9, padding: '16px 20px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 9, padding: '2px 7px', border: `1px solid ${color}50`, borderRadius: 3, color, fontFamily: 'DM Mono, monospace', fontWeight: 700, letterSpacing: '0.1em' }}>{insight.severity}</span>
        {insight.metric && <span style={{ fontSize: 10, color: T.sub, fontFamily: 'DM Mono, monospace' }}>{insight.metric}: {insight.value}</span>}
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{insight.title}</p>
      <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 10 }}>{insight.body}</p>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: `${color}10`, borderRadius: 6, border: `1px solid ${color}20` }}>
        <ArrowRight size={12} style={{ color, marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color, lineHeight: 1.5 }}>{insight.action}</p>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<{ current: Metrics | null; previous: Metrics | null }>({ current: null, previous: null });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noMetrics, setNoMetrics] = useState(false);

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(d => {
      const all = d.metrics ?? [];
      if (all.length === 0) { setNoMetrics(true); setLoading(false); return; }
      setMetrics({ current: all[0] ?? null, previous: all[1] ?? null });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'insights' }),
      });
      const d = await res.json();

      if (!res.ok) {
        setError(d.error || 'Analysis failed');
        setAnalyzing(false);
        return;
      }

      if (d.data && Array.isArray(d.data)) {
        const mapped = d.data.map((item: Insight, i: number) => ({
          ...item,
          id: String(i),
          created_at: new Date().toISOString(),
        }));
        setInsights(mapped);

        // Persist insights to the API so the Feed page can read them
        try {
          await fetch('/api/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ insights: d.data, source: 'dashboard' }),
          });
        } catch (e) {
          console.warn('Failed to persist insights to feed:', e);
        }

        // Also persist to localStorage as a fallback
        try {
          const existing = JSON.parse(localStorage.getItem('rise_insights') || '[]');
          const combined = [...mapped, ...existing].slice(0, 50);
          localStorage.setItem('rise_insights', JSON.stringify(combined));
        } catch (e) {
          console.warn('localStorage save failed:', e);
        }
      }
    } catch (e) {
      console.error(e);
      setError('Network error. Please try again.');
    }
    setAnalyzing(false);
  };

  const c = metrics.current;
  const p = metrics.previous;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${T.border}`, background: `${T.bg}ee`, backdropFilter: 'blur(12px)', padding: '0 28px', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>RISE</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href}>
                <span style={{ fontSize: 12, color: n.href === '/' ? T.text : T.sub, padding: '4px 10px', borderRadius: 5, background: n.href === '/' ? T.border : 'transparent', cursor: 'pointer' }}>{n.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.accent, boxShadow: `0 0 7px ${T.accent}` }} />
          <span style={{ fontSize: 10, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>LIVE</span>
        </div>
      </nav>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 28px 72px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 14 }}>
            <RefreshCw size={22} style={{ color: T.accent }} className="spin" />
            <p style={{ color: T.sub, fontSize: 12, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>LOADING INTELLIGENCE</p>
          </div>
        ) : noMetrics ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <Activity size={40} style={{ color: T.accent, margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>No metrics yet</h2>
            <p style={{ color: T.sub, marginBottom: 24, fontSize: 14 }}>Add your first metrics snapshot to start receiving intelligence.</p>
            <Link href="/setup"><button style={{ padding: '10px 24px', background: T.accent, color: T.bg, borderRadius: 7, fontWeight: 800, fontSize: 13, cursor: 'pointer', border: 'none', letterSpacing: '0.06em' }}>ADD METRICS</button></Link>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Revenue Intelligence</h1>
                  <p style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{c?.snapshot_date ?? 'Latest period'} - {c?.created_at ? new Date(c.created_at).toLocaleDateString() : 'Now'}</p>
                </div>
                <button onClick={runAnalysis} disabled={analyzing} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: analyzing ? T.border : T.accent, color: analyzing ? T.sub : T.bg, borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: analyzing ? 'not-allowed' : 'pointer', border: 'none', letterSpacing: '0.06em', transition: 'all 0.15s' }}>
                  {analyzing ? <><RefreshCw size={13} className="spin" /> ANALYZING...</> : <><Zap size={13} /> RUN ANALYSIS</>}
                </button>
              </div>
            </motion.div>

            {error && (
              <div style={{ padding: '12px 16px', background: `${T.red}15`, border: `1px solid ${T.red}30`, borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: T.red }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 32 }}>
              <MetricCard label="MONTHLY REVENUE" value={c?.monthly_revenue} prev={p?.monthly_revenue} />
              <MetricCard label="PIPELINE VALUE" value={c?.pipeline_value} prev={p?.pipeline_value} />
              <MetricCard label="LTV" value={c?.customer_ltv} prev={p?.customer_ltv} />
              <MetricCard label="CAC" value={c?.customer_cac} prev={p?.customer_cac} />
              <MetricCard label="CHURN RATE" value={c?.monthly_churn_rate} prev={p?.monthly_churn_rate} unit="%" />
              <MetricCard label="CLOSE RATE" value={c?.close_rate} prev={p?.close_rate} unit="%" />
            </div>

            {insights.length > 0 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  <BarChart3 size={14} style={{ color: T.accent }} />
                  <span style={{ fontSize: 10, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', fontWeight: 600 }}>GRIP INTELLIGENCE INSIGHTS</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', background: T.accentDim, border: `1px solid ${T.accent}25`, borderRadius: 3, color: T.accent, fontFamily: 'DM Mono, monospace' }}>{insights.length}</span>
                </div>
                {insights.map((ins, i) => <InsightCard key={ins.id} insight={ins} i={i} />)}
              </div>
            ) : (
              <div style={{ padding: 28, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, textAlign: 'center' }}>
                <Zap size={24} style={{ color: T.accent, margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: T.sub }}>Click &quot;Run Analysis&quot; to generate GRIP intelligence insights from your metrics.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
