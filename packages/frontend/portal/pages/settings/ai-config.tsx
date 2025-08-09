import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import useSupabase from '../../hooks/useSupabase';
import { supabase, Tenant } from '../../lib/supabaseClient';

const getTenantId = (user: any): string | undefined =>
  user?.user_metadata?.tenant_id ?? user?.app_metadata?.tenant_id ?? user?.tenant_id;

type Config = Tenant['config_json'];

const AiConfigSettingsPage: React.FC = () => {
  const { user } = useSupabase();
  const [config, setConfig] = useState<Config>({
    system_prompt: '',
    elevenlabs_voice: '',
    notification_emails: [],
    calendar_id: '',
    llm_consensus_enabled: false,
    llm_consensus_strategy: '',
    widget_settings: { primary_color: '#111827', avatar_image: '', position: 'bottom-right' },
  });
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
        if (data?.config_json) {
          setConfig({
            widget_settings: { position: 'bottom-right', ...data.config_json.widget_settings },
            ...data.config_json,
          });
        }
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load config');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tenantId]);

  const update = (patch: Partial<Config>) => setConfig((c) => ({ ...c, ...patch }));

  const onSave = async () => {
    if (!tenantId) return;
    try {
      setSaving(true);
      setSaved(false);
      setError(null);
      const { error } = await supabase
        .from('tenants')
        .update({ config_json: config })
        .eq('id', tenantId);
      if (error) throw error;
      setSaved(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="AI Configuration">
      <Head>
        <title>AI Configuration - LeadSpark Portal</title>
      </Head>

      <div className="container mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-2 text-2xl font-semibold">AI Configuration</h1>
        <p className="mb-4 text-sm text-gray-500">Tune prompts, voices, notifications, and widget behavior.</p>

        {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">{error}</div>}
        {saved && <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-green-700">Saved!</div>}

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium">System Prompt</label>
              <textarea
                rows={6}
                value={config.system_prompt ?? ''}
                onChange={(e) => update({ system_prompt: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">ElevenLabs Voice ID</label>
                <input
                  value={config.elevenlabs_voice ?? ''}
                  onChange={(e) => update({ elevenlabs_voice: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Calendar ID</label>
                <input
                  value={config.calendar_id ?? ''}
                  onChange={(e) => update({ calendar_id: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Notification Emails (comma separated)</label>
              <input
                value={(config.notification_emails ?? []).join(', ')}
                onChange={(e) =>
                  update({
                    notification_emails: e.target.value
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="ops@example.com, founders@example.com"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(config.llm_consensus_enabled)}
                  onChange={(e) => update({ llm_consensus_enabled: e.target.checked })}
                />
                <span className="text-sm">Enable LLM Consensus</span>
              </label>

              <div>
                <label className="mb-1 block text-sm font-medium">Consensus Strategy</label>
                <input
                  value={config.llm_consensus_strategy ?? ''}
                  onChange={(e) => update({ llm_consensus_strategy: e.target.value })}
                  placeholder="e.g., majority, weighted, veto"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                />
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h2 className="mb-3 text-lg font-medium">Widget Settings</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Primary Color</label>
                  <input
                    type="color"
                    value={config.widget_settings?.primary_color ?? '#111827'}
                    onChange={(e) =>
                      update({ widget_settings: { ...config.widget_settings, primary_color: e.target.value } })
                    }
                    className="h-10 w-full rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Avatar Image URL</label>
                  <input
                    value={config.widget_settings?.avatar_image ?? ''}
                    onChange={(e) =>
                      update({ widget_settings: { ...config.widget_settings, avatar_image: e.target.value } })
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium">Position</label>
                  <select
                    value={config.widget_settings?.position ?? 'bottom-right'}
                    onChange={(e) =>
                      update({
                        widget_settings: {
                          ...config.widget_settings,
                          position: e.target.value as 'bottom-right' | 'bottom-left',
                        },
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSave}
                disabled={saving}
                className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AiConfigSettingsPage;
