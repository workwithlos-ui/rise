'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, Info, Zap, RefreshCw, Filter, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Insight, Severity } from '@/lib/types';

const T = { bg: '#050505', surface: '#111111', border: '#1a1a1a', accent: '#c8f542', accentDim: '#c8f54214', red: '#ff4444', amber: '#f5a623', green: '#22c55e', text: '#ffffff', sub: '#6b6b6b' };
const NAV = [{ href: '/', label: 'Dashboard' }, { href: '/feed', label: 'Feed' }, { href: '/report', label: 'Report' }, { href: '/setup', label: 'Setup' }];

const SEV_CONFIG: Record<Severity, { color: string; icon: any; label: string }> = {
  CRITICAL: { color: T.red, icon: AlertTriangle, label: 'Critical' },
  WARNING: { color: T.amber, icon: AlertTriangle, label: 'Warning' },
  OPPORTUNITY: { color: T.accent, icon: TrendingUp, label: 'Opportunity' },
  INFO: { color: T.sub, icon: Info, label: 'Info' },
};

const FILTERS: Array<{ key: Severity | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'CRITICAL', label: 'Critical' },
  { key: 'WARNING', label: 'Warning' },
  { key: 'OPPORTUNITY', label: 'Opportunity' },
  { key: 'INFO', label: 'Info' },
];

export default function Feed() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Severity | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ran, setRan] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'insights' }) });
      const d = await res.json();
      if (d.data && Array.isArray(d.data)) {
        const mapped = d.data.map((item: Insight, i: number) => ({ ...item, id: `insight-${Date.now()}-${i}`, created_at: new Date().toISOString() }));
        setInsights(prev => [...mapped, ...prev]);
        setRan(true);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filtered = filter === 'ALL' ? insights : insights.filter(i => i.severity === filter);
  const counts = { CRITICAL: insights.filter(i => i.severity === 'CRITICAL').length, WARNING: insights.filter(i => i.severity === 'WARNING').length, OPPORTUNITY: insights.filter(i => i.severity === 'OPPORTUNITY').length, INFO: insights.filter(i => i.severity === 'INFO').length };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${T.border}`, background: `${T.bg}ee`, backdropFilter: 'blur(12px)', padding: '0 28px', height: 50, display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: T.accent, fontFamily: 'DM Mono, monospace' }}>RISE</span>
        {NAV.map(n => <Link key={n.href} href={n.href}><span style={{ fontSize: 12, color: n.href === '/feed' ? T.text : T.sub, padding: '4px 10px', borderRadius: 5, background: n.href === '/feed' ? T.border : 'transparent', cursor: 'pointer' }}>{n.label}</span></Link>)}
      </nav>
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '36px 28px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <span style={{ fontSize: 10, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.15em', display: 'block', marginBottom: 8 }}>INTELLIGENCE FEED</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Insights</h1>
            <p style={{ fontSize: 13, color: T.sub, marginTop: 5 }}>AI-generated business intelligence, ranked by severity.</p>
          </div>
          <button onClick={runAnalysis} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: loading ? T.border : T.accent, color: loading ? T.sub : T.bg, borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', letterSpacing: '0.06em' }}>
            {loading ? <><RefreshCw size={13} className="spin" />ANALYZING</> : <><Zap size={13} />GENERATE INSIGHTS</>}
          </button>
        </motion.div>

        {insights.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <Filter size={12} style={{ color: T.sub }} />
            {FILTERS.map(f => {
              const count = f.key === 'ALL' ? insights.length : counts[f.key as Severity];
              const active = filter === f.key;
              const color = f.key === 'ALL' ? T.accent : SEV_CONFIG[f.key as Severity]?.color ?? T.sub;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, border: `1px solid ${active ? color + '60' : T.border}`, background: active ? color + '14' : 'transparent', color: active ? color : T.sub, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Mono, monospace', fontWeight: active ? 700 : 400 }}>
                  {f.label} {count > 0 && <span style={{ fontSize: 10, background: active ? color + '25' : T.border, padding: '1px 5px', borderRadius: 3 }}>{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        {!ran && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <Zap size={32} style={{ color: T.accent, margin: '0 auto 14px' }} />
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No insights yet</p>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>Generate your first analysis to see intelligence insights here.</p>
            <button onClick={runAnalysis} style={{ padding: '9px 20px', background: T.accent, color: T.bg, borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none' }}>Generate Now</button>
          </div>
        )}

        <AnimatePresence>
          {filtered.map((insight, i) => {
            const cfg = SEV_CONFIG[insight.severity];
            const Icon = cfg.icon;
            const isOpen = expanded === insight.id;
            return (
              <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: T.surface, border: `1px solid ${cfg.color}30`, borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(isOpen ? null : insight.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: cfg.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', border: `1px solid ${cfg.color}40`, borderRadius: 3, color: cfg.color, fontFamily: 'DM Mono, monospace', fontWeight: 700, letterSpacing: '0.1em' }}>{insight.severity}</span>
                      {insight.metric && <span style={{ fontSize: 10, color: T.sub, fontFamily: 'DM Mono, monospace' }}>{insight.metric}{insight.value ? `: ${insight.value}` : ''}</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: isOpen ? 0 : 4 }}>{insight.title}</p>
                    {!isOpen && <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{insight.body}</p>}
                  </div>
                  <ChevronRight size={14} style={{ color: T.sub, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginTop: 4 }} />
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      style={{ padding: '0 20px 18px 62px', borderTop: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.65, marginTop: 14, marginBottom: 14 }}>{insight.body}</p>
                      {insight.benchmark && <p style={{ fontSize: 11, color: T.sub, fontFamily: 'DM Mono, monospace', marginBottom: 12 }}>BENCHMARK: {insight.benchmark}</p>}
                      <div style={{ display: 'flex', gap: 8, padding: '11px 14px', background: cfg.color + '10', border: `1px solid ${cfg.color}20`, borderRadius: 7 }}>
                        <ChevronRight size={12} style={{ color: cfg.color, marginTop: 2, flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: cfg.color, lineHeight: 1.5 }}>{insight.action}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>
    </div>
  );
}
