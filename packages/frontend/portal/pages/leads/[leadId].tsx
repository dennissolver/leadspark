import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import useSupabase from '../../hooks/useSupabase';
import { dbHelpers, Lead } from '../../lib/supabaseClient';

const getTenantId = (user: any): string | undefined =>
  user?.user_metadata?.tenant_id ?? user?.app_metadata?.tenant_id ?? user?.tenant_id;

const LeadDetailPage: React.FC = () => {
  const { user } = useSupabase();
  const router = useRouter();
  const { leadId } = router.query as { leadId?: string };

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = getTenantId(user);

  useEffect(() => {
    const run = async () => {
      if (!tenantId || !leadId) return;
      try {
        setLoading(true);
        const data = await dbHelpers.getLead(leadId, tenantId);
        setLead(data);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tenantId, leadId]);

  return (
    <Layout title="Lead Details">
      <Head>
        <title>Lead Details - LeadSpark Portal</title>
      </Head>

      <div className="container mx-auto max-w-4xl px-4 py-6">
        <button onClick={() => router.back()} className="mb-4 text-sm text-blue-600 underline">
          ← Back
        </button>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">{error}</div>
        )}

        {loading || !lead ? (
          <div className="text-gray-500">{loading ? 'Loading…' : 'Lead not found.'}</div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">
              {lead.first_name} {lead.last_name}
            </h1>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-500">Email</div>
                <div>{lead.email}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-500">Phone</div>
                <div>{lead.phone || '—'}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-500">Status</div>
                <div className="capitalize">{lead.status}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-sm text-gray-500">Created</div>
                <div>{new Date(lead.created_at).toLocaleString()}</div>
              </div>
            </div>

            {lead.investment_goals && (
              <div className="rounded-xl border p-4">
                <div className="mb-1 text-sm font-medium">Investment Goals</div>
                <div className="text-gray-700">{lead.investment_goals}</div>
              </div>
            )}

            {lead.notes && (
              <div className="rounded-xl border p-4">
                <div className="mb-1 text-sm font-medium">Notes</div>
                <div className="text-gray-700 whitespace-pre-wrap">{lead.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LeadDetailPage;
