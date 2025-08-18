import React from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import { GetServerSidePropsContext } from 'next';
import { createSupabaseServerClient } from '@leadspark/common/src/utils/supabase/supabaseClient';

// Define the structure of a KnowledgeBaseEntry object
interface KnowledgeBaseEntry {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  created_at: string;
}

// Define the props that the component will receive from the server
interface KnowledgeBasePageProps {
  entries: KnowledgeBaseEntry[];
  error: string | null;
}

// The main component, receiving data as props from getServerSideProps
export default function KnowledgeBaseIndexPage({ entries, error }: KnowledgeBasePageProps) {
  if (error) {
    return (
      <Layout title="Knowledge Base">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Knowledge Base">
      <Head>
        <title>Knowledge Base</title>
      </Head>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Knowledge Base</h1>
        {entries.length === 0 ? (
          <div className="rounded-lg border px-4 py-8 text-center text-gray-500">
            No knowledge base entries found.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="text-xl font-medium">{entry.title}</h2>
                <p className="mt-2 text-gray-600">{entry.content}</p>
                <p className="mt-2 text-sm text-gray-400">
                  Created on: {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// Server-side function to fetch data for the component
export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
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

    // Fetch knowledge base entries for the authenticated user's tenant
    const { data: entries, error } = await supabase
      .from('knowledge_base')
      .select('id, tenant_id, title, content, created_at')
      .order('created_at', { ascending: false });

    return {
      props: {
        entries: entries ?? [],
        error: error ? error.message : null,
      },
    };
  } catch (err: any) {
    console.error('Error in getServerSideProps:', err);
    return {
      props: {
        entries: [],
        error: err.message || 'An unexpected error occurred while fetching knowledge base entries.',
      },
    };
  }
}
