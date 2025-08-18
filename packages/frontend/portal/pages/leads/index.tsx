import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout';
import { createSupabaseServerClient } from '@leadspark/common/src/utils/supabase/supabaseClient';
import { GetServerSidePropsContext } from 'next';

// Define the structure of a Lead object for type safety
interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  investment_goals: string | null;
  source: string | null;
  notes: string | null;
}

// Define the props that the component will receive from the server
interface LeadsIndexPageProps {
  leads: Lead[];
  error: string | null;
}

// The main component, now accepting data as props from getServerSideProps
export default function LeadsIndexPage({ leads: initialLeads, error }: LeadsIndexPageProps) {
  // Use local state for filtering, initialized with the server-side fetched data
  const [q, setQ] = useState('');
  const [leads] = useState(initialLeads);

  // Memoize the filtered leads to avoid re-calculating on every render
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

  // Display an error message if one was passed from the server
  if (error) {
    return (
      <Layout title="Leads">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">{error}</div>
        </div>
      </Layout>
    );
  }

  // Main component render logic
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
        {filtered.length === 0 ? (
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
}

// Server-side function to fetch data and pass it to the component
export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    // Create a Supabase client for the server-side environment
    const supabase = createSupabaseServerClient(context);

    // Get the authenticated user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // If there's no user or an error, redirect to the login page
    if (userError || !user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Fetch leads for the authenticated user
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, status, created_at, investment_goals, source, notes')
      .order('created_at', { ascending: false });

    // Return the data as props
    return {
      props: {
        leads: leads ?? [],
        error: error ? error.message : null,
      },
    };
  } catch (err: any) {
    // Handle any unexpected errors during the server-side process
    console.error('Error in getServerSideProps:', err);
    return {
      props: {
        leads: [],
        error: err.message || 'An unexpected error occurred while fetching leads.',
      },
    };
  }
}
