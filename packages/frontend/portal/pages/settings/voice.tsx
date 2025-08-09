import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import useSupabase from '../../hooks/useSupabase';
import { supabase, Tenant } from '../../lib/supabaseClient';

const getTenantId = (user: any): string | undefined =>
  user?.user_metadata?.tenant_id ?? user?.app_metadata?.tenant_id ?? user?.tenant_id;

const VoiceSettingsPage: React.FC = () => {
  const { user } = useSupabase();
  const [voiceId, setVoiceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const tenantId = getTenantId(user);

  useEffect(() => {
    const run = async () => {
      if (!tenantId) return;
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('tenants')
          .select('config_json')
          .eq('id', tenantId)
          .single();
        if (error) throw error;
        const cfg = (data?.config_json || {}) as Tenant['config_json'];
        setVoiceId(cfg.elevenlabs_voice ?? '');
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load voice settings');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tenantId]);

  const save = async () => {
    if (!tenantId) return;
    try {
      setSaving(true);
      setSaved(false);
      setError(null);

      // Load existing, update only the voice field
      const { data: existing } = await supabase
        .from('tenants')
        .select('config_json')
        .eq('id', tenantId)
        .single();

      const cfg = ((existing?.config_json as any) || {}) as Tenant['config_json'];
      const nextCfg = { ...cfg, elevenlabs_voice: voiceId };

      const { error } = await supabase.from('tenants').update({ config_json: nextCfg }).eq('id', tenantId);
      if (error) throw error;
      setSaved(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save voice settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Voice Settings">
      <Head>
        <title>Voice Settings - LeadSpark Portal</title>
      </Head>

      <div className="container mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-2 text-2xl font-semibold">Voice Settings</h1>
        <p className="mb-4 text-sm text-gray-500">Configure the ElevenLabs voice used by your assistant.</p>

        {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">{error}</div>}
        {saved && <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-green-700">Saved!</div>}

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">ElevenLabs Voice ID</label>
              <input
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="elevenlabs voice id"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VoiceSettingsPage;
