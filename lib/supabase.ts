import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  _client = createClient(url, key);
  return _client;
}

export async function getSharedContext() {
  const { data, error } = await getClient()
    .from('shared_context')
    .select('*')
    .limit(1)
    .single();
  if (error) {
    console.warn('[supabase] shared_context:', error.message);
    return null;
  }
  return data;
}

export async function getLatestMetrics(limit = 2) {
  const { data, error } = await getClient()
    .from('rise_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[supabase] rise_metrics:', error.message);
    return [];
  }
  return data ?? [];
}

export async function saveMetrics(metrics: Record<string, number | string | null | undefined>) {
  const { data, error } = await getClient()
    .from('rise_metrics')
    .insert([metrics])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getMetricsHistory(limit = 12) {
  const { data, error } = await getClient()
    .from('rise_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}
