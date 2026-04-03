'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, Send, FileText, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { WeeklyReport } from '@/lib/types';

const T = { bg: '#050505', surface: '#111111', border: '#1a1a1a', accent: '#c8f542', accentDim: '#c8f54214', red: '#ff4444', amber: '#f5a623', green: '#22c55e', text: '#ffffff', sub: '#6b6b6b', dim: '#333333' };
const NAV = [{ href: '/', label: 'Dashboard' }, { href: '/feed', label: 'Feed' }, { href: '/report', label: 'Report' }, { href: '/setup', label: 'Setup' }];

const QUICK_QUESTIONS = [
  'What is my single highest-leverage revenue action this week?',
  'Analyze my LTV:CAC ratio and tell me if I should prioritize retention or acquisition.',
  'Where is pipeline leaking and what does it cost me per month?',
  'What content or offer should I build next based on my ICP and proof bank?',
  'If I raise prices 20%, what happens to my growth math?',
];

export default function Report() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ headline: string; analysis: string; action_plan: string[]; risks: string[]; opportunities: string[] } | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [mode, setMode] = useState<'ask' | 'weekly'>('ask');
  const [error, setError] = useState<string | null>(null);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnalysis(null);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, mode: 'deep' }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Analysis failed. Please try again.');
      } else if (d.data) {
        setAnalysis(d.data);
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError('Request timed out. The analysis is taking longer than expected. Please try again.');
      } else {
        console.error(e);
        setError('Network error. Please check your connection and try again.');
      }
    }
    setLoading(false);
  };

  const generateWeekly = async () => {
    setWeeklyLoading(true);
    setWeeklyReport(null);
    setWeeklyError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);

      const res = await fetch('/api/weekly-report', {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const d = await res.json();
      if (!res.ok) {
        setWeeklyError(d.error || 'Report generation failed. Please try again.');
      } else if (d.report) {
        setWeeklyReport(d.report);
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        setWeeklyError('Report generation timed out. Please try again.');
      } else {
        console.error(e);
        setWeeklyError('Network error. Please check your connection and try again.');
      }
    }
    setWeeklyLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${T.border}`, background: `${T.bg}ee`, backdropFilter: 'blur(12px)', padding: '0 28px', height: 50, display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: T.accent, fontFamily: 'DM Mono, monospace' }}>RISE</span>
        {NAV.map(n => <Link key={n.href} href={n.href}><span style={{ fontSize: 12, color: n.href === '/report' ? T.text : T.sub, padding: '4px 10px', borderRadius: 5, background: n.href === '/report' ? T.border : 'transparent', cursor: 'pointer' }}>{n.label}</span></Link>)}
      </nav>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '36px 28px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 10, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.15em', display: 'block', marginBottom: 8 }}>REPORT GENERATOR</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Deep Analysis</h1>
          <p style={{ fontSize: 13, color: T.sub }}>GRIP-scored analysis with your shared context and latest metrics. Specific dollar math, no generic advice.</p>
        </motion.div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ key: 'ask', label: 'Ask RISE', icon: Brain }, { key: 'weekly', label: 'Weekly Report', icon: Calendar }].map(tab => (
            <button key={tab.key} onClick={() => setMode(tab.key as 'ask' | 'weekly')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 7, border: `1px solid ${mode === tab.key ? T.accent + '50' : T.border}`, background: mode === tab.key ? T.accentDim : T.surface, color: mode === tab.key ? T.accent : T.sub, fontSize: 12, cursor: 'pointer', fontWeight: mode === tab.key ? 700 : 400 }}>
              <tab.icon size={13} />{tab.label}
            </button>
          ))}
        </div>

        {mode === 'ask' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: T.sub, fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em', marginBottom: 10 }}>QUICK QUESTIONS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <button key={i} onClick={() => setQuestion(q)}
                    style={{ fontSize: 11, padding: '5px 11px', border: `1px solid ${T.border}`, borderRadius: 5, background: T.surface, color: T.sub, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = T.accent + '40'; (e.target as HTMLElement).style.color = T.text; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = T.border; (e.target as HTMLElement).style.color = T.sub; }}>
                    {q.slice(0, 60)}{q.length > 60 ? '...' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', marginBottom: 12 }}>
              <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask RISE anything about your business. It knows your ICPs, proof bank, metrics, and offers..." rows={3}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask(); }}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'DM Sans, sans-serif' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 10, color: T.dim, fontFamily: 'DM Mono, monospace' }}>GRIP-SCORED ANALYSIS</span>
                <button onClick={ask} disabled={loading || !question.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: question.trim() ? T.accent : T.dim, color: T.bg, borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: !question.trim() ? 'not-allowed' : 'pointer', border: 'none', letterSpacing: '0.06em' }}>
                  {loading ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
                  {loading ? 'ANALYZING...' : 'ANALYZE'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: `${T.red}15`, border: `1px solid ${T.red}30`, borderRadius: 8, marginBottom: 16 }}>
                <AlertCircle size={16} style={{ color: T.red, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: T.red }}>{error}</p>
              </div>
            )}

            {analysis && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: '22px 24px' }}>
                  <span style={{ fontSize: 9, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 10 }}>HEADLINE FINDING</span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{analysis.headline}</h2>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '22px 24px' }}>
                  <span style={{ fontSize: 9, color: T.sub, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 14 }}>DEEP ANALYSIS</span>
                  <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{analysis.analysis}</p>
                </div>
                {analysis.action_plan?.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '22px 24px' }}>
                    <span style={{ fontSize: 9, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 14 }}>ACTION PLAN</span>
                    {analysis.action_plan.map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < analysis.action_plan.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <span style={{ fontSize: 10, color: T.accent, fontFamily: 'DM Mono, monospace', fontWeight: 700, background: T.accentDim, padding: '2px 5px', borderRadius: 3, height: 'fit-content', marginTop: 2, flexShrink: 0, border: `1px solid ${T.accent}25` }}>{String(i + 1).padStart(2, '0')}</span>
                        <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.55 }}>{a}</p>
                      </div>
                    ))}
                  </div>
                )}
                {(analysis.risks?.length > 0 || analysis.opportunities?.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {analysis.risks?.length > 0 && (
                      <div style={{ background: T.surface, border: `1px solid ${T.red}30`, borderRadius: 10, padding: '18px 20px' }}>
                        <span style={{ fontSize: 9, color: T.red, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>RISKS</span>
                        {analysis.risks.map((r, i) => <p key={i} style={{ fontSize: 12, color: '#ff8888', lineHeight: 1.55, marginBottom: 8 }}>- {r}</p>)}
                      </div>
                    )}
                    {analysis.opportunities?.length > 0 && (
                      <div style={{ background: T.surface, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: '18px 20px' }}>
                        <span style={{ fontSize: 9, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>OPPORTUNITIES</span>
                        {analysis.opportunities.map((o, i) => <p key={i} style={{ fontSize: 12, color: T.accent, lineHeight: 1.55, marginBottom: 8 }}>+ {o}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        {mode === 'weekly' && (
          <div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '24px', marginBottom: 20, textAlign: 'center' }}>
              <Calendar size={28} style={{ color: T.accent, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Weekly Intelligence Report</p>
              <p style={{ fontSize: 13, color: T.sub, marginBottom: 20, lineHeight: 1.6 }}>GRIP-scored analysis comparing your current metrics to the previous period, identifying trends, and generating a full intelligence brief with prioritized actions.</p>
              <button onClick={generateWeekly} disabled={weeklyLoading}
                style={{ padding: '10px 24px', background: weeklyLoading ? T.border : T.accent, color: weeklyLoading ? T.sub : T.bg, borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: weeklyLoading ? 'not-allowed' : 'pointer', border: 'none', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                {weeklyLoading ? <><Loader2 size={13} className="spin" />GENERATING REPORT...</> : <><FileText size={13} />GENERATE WEEKLY REPORT</>}
              </button>
            </div>

            {weeklyError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: `${T.red}15`, border: `1px solid ${T.red}30`, borderRadius: 8, marginBottom: 16 }}>
                <AlertCircle size={16} style={{ color: T.red, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, color: T.red, marginBottom: 4 }}>{weeklyError}</p>
                  <button onClick={generateWeekly} style={{ fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Try again</button>
                </div>
              </div>
            )}

            {weeklyReport && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: '22px 24px' }}>
                  <span style={{ fontSize: 9, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 10 }}>{weeklyReport.period}</span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{weeklyReport.headline}</h2>
                  <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7 }}>{weeklyReport.summary}</p>
                </div>

                {weeklyReport.top_metric_changes?.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '22px 24px' }}>
                    <span style={{ fontSize: 9, color: T.sub, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 14 }}>METRIC CHANGES</span>
                    {weeklyReport.top_metric_changes.map((mc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < weeklyReport.top_metric_changes.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: T.sub, minWidth: 140 }}>{mc.metric}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: mc.direction === 'up' ? T.green : mc.direction === 'down' ? T.red : T.sub }}>{mc.change}</span>
                        <span style={{ fontSize: 12, color: T.sub, flex: 1 }}>{mc.significance}</span>
                      </div>
                    ))}
                  </div>
                )}

                {weeklyReport.recommended_actions?.length > 0 && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '22px 24px' }}>
                    <span style={{ fontSize: 9, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 14 }}>RECOMMENDED ACTIONS</span>
                    {weeklyReport.recommended_actions.sort((a, b) => a.priority - b.priority).map((ra, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < weeklyReport.recommended_actions.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <span style={{ fontSize: 11, color: T.accent, fontFamily: 'DM Mono, monospace', background: T.accentDim, padding: '2px 6px', borderRadius: 3, fontWeight: 700, height: 'fit-content', marginTop: 2, border: `1px solid ${T.accent}25`, flexShrink: 0 }}>P{ra.priority}</span>
                        <div>
                          <p style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 4 }}>{ra.action}</p>
                          <p style={{ fontSize: 12, color: T.sub }}>{ra.expected_outcome} / {ra.timeline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {weeklyReport.risks?.length > 0 && (
                    <div style={{ background: T.surface, border: `1px solid ${T.red}30`, borderRadius: 10, padding: '18px 20px' }}>
                      <span style={{ fontSize: 9, color: T.red, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>RISKS</span>
                      {weeklyReport.risks.map((r, i) => <p key={i} style={{ fontSize: 12, color: '#ff8888', lineHeight: 1.55, marginBottom: 8 }}>- {r}</p>)}
                    </div>
                  )}
                  {weeklyReport.opportunities?.length > 0 && (
                    <div style={{ background: T.surface, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: '18px 20px' }}>
                      <span style={{ fontSize: 9, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>OPPORTUNITIES</span>
                      {weeklyReport.opportunities.map((o, i) => <p key={i} style={{ fontSize: 12, color: T.accent, lineHeight: 1.55, marginBottom: 8 }}>+ {o}</p>)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
