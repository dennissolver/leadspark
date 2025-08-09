import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout';
import useSupabase from '../../hooks/useSupabase';
import { dbHelpers, Lead } from '../../lib/supabaseClient';

const getTenantId = (user: any): string | undefined =>
  user?.user_metadata?.tenant_id ?? user?.app_metadata?.tenant_id ?? user?.tenant_id;

const LeadsIndexPage: React.FC = () => {
  const { user } = useSupabase();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tenantId = getTenantId(user);

  useEffect(() => {
    const run = async () => {
      if (!tenantId) return;
      try {
        setLoading(true);
        const data = await dbHelpers.getLeads(tenantId);
        setLeads(data);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load leads');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tenantId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) =>
      [
        l.first_name,
        l.last_name,
        l.email,
        l.phone ?? '',
        l.status,
        l.investment_goals ?? '',
        l.source ?? '',
        l.notes ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(s),
    );
  }, [leads, q]);

  return (
    <Layout title="Leads">
      <Head>
        <title>Leads - LeadSpark Portal</title>
      </Head>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Leads</h1>

        <div className="mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, status…"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border px-4 py-8 text-center text-gray-500">No leads yet.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-3 py-2">
                      <Link href={`/leads/${l.id}`} className="text-blue-600 underline">
                        {l.first_name} {l.last_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{l.email}</td>
                    <td className="px-3 py-2">{l.phone || '—'}</td>
                    <td className="px-3 py-2 capitalize">{l.status}</td>
                    <td className="px-3 py-2">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LeadsIndexPage;
