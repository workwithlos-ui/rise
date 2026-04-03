'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

const T = { bg: '#050505', surface: '#111111', border: '#1a1a1a', accent: '#c8f542', text: '#ffffff', sub: '#6b6b6b' };
const NAV = [{ href: '/', label: 'Dashboard' }, { href: '/feed', label: 'Feed' }, { href: '/report', label: 'Report' }, { href: '/setup', label: 'Setup' }];

const FIELDS = [
  { key: 'monthly_revenue', label: 'Monthly Revenue', placeholder: '50000', required: true, prefix: '$' },
  { key: 'monthly_ad_spend', label: 'Monthly Ad Spend', placeholder: '8000', prefix: '$' },
  { key: 'customer_ltv', label: 'Customer LTV', placeholder: '8400', prefix: '$' },
  { key: 'customer_cac', label: 'Customer Acquisition Cost (CAC)', placeholder: '450', prefix: '$' },
  { key: 'monthly_churn_rate', label: 'Monthly Churn Rate', placeholder: '5', suffix: '%' },
  { key: 'pipeline_value', label: 'Pipeline Value', placeholder: '125000', prefix: '$' },
  { key: 'close_rate', label: 'Close Rate', placeholder: '22', suffix: '%' },
  { key: 'avg_deal_size', label: 'Average Deal Size', placeholder: '8300', prefix: '$' },
  { key: 'notes', label: 'Notes (optional)', placeholder: 'Any context for this period...', isText: true },
];

export default function Setup() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!form.monthly_revenue) { setError('Monthly revenue is required.'); return; }
    setSaving(true); setError(null);
    try {
      const payload: Record<string, number | string> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v) payload[k] = k === 'notes' ? v : parseFloat(v);
      }
      const res = await fetch('/api/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setForm({});
    } catch (e) { setError('Save failed. Check console.'); }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'DM Sans, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${T.border}`, background: `${T.bg}ee`, backdropFilter: 'blur(12px)', padding: '0 28px', height: 50, display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: T.accent, fontFamily: 'DM Mono, monospace' }}>RISE</span>
        {NAV.map(n => <Link key={n.href} href={n.href}><span style={{ fontSize: 12, color: n.href === '/setup' ? T.text : T.sub, padding: '4px 10px', borderRadius: 5, background: n.href === '/setup' ? T.border : 'transparent', cursor: 'pointer' }}>{n.label}</span></Link>)}
      </nav>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 28px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 10, color: T.accent, fontFamily: 'DM Mono, monospace', letterSpacing: '0.15em', display: 'block', marginBottom: 10 }}>METRICS SETUP</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Add a metrics snapshot</h1>
          <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>Each submission creates a timestamped record. RISE compares periods to detect trends and anomalies using GRIP scoring (Gravity, Reach, Impact, Proof).</p>
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FIELDS.map((f, i) => (
            <motion.div key={f.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: '16px 18px' }}>
              <label style={{ fontSize: 10, color: T.sub, letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 8 }}>{f.label.toUpperCase()}{f.required ? ' *' : ''}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {f.prefix && <span style={{ fontSize: 14, color: T.sub, fontFamily: 'DM Mono, monospace' }}>{f.prefix}</span>}
                <input type={f.isText ? 'text' : 'number'} value={form[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 18, fontWeight: 700, color: T.text, fontFamily: 'DM Mono, monospace' }} />
                {f.suffix && <span style={{ fontSize: 14, color: T.sub, fontFamily: 'DM Mono, monospace' }}>{f.suffix}</span>}
              </div>
            </motion.div>
          ))}
        </div>
        {error && <p style={{ fontSize: 13, color: '#ff6666', marginTop: 16 }}>{error}</p>}
        <button onClick={save} disabled={saving} style={{ marginTop: 24, width: '100%', padding: '13px 0', background: saved ? T.accent : saving ? T.border : T.accent, color: T.bg, borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saving ? <><Loader2 size={14} className="spin" />SAVING...</> : saved ? <><CheckCircle2 size={14} />SAVED - Go to Dashboard</> : 'SAVE METRICS SNAPSHOT'}
        </button>
        {saved && <Link href="/"><p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: T.accent, cursor: 'pointer' }}>View Dashboard and run analysis</p></Link>}
      </main>
    </div>
  );
}
