// packages/frontend/portal/pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabase } from '@leadspark/common/src/utils/supabase/useSupabase';
import { Card, CardContent, CardHeader, CardTitle, Button, LeadCard } from '@leadspark/ui/components';
import Layout from '../components/layout'; // Ensure this exists
import { RealtimeChannel } from '@supabase/supabase-js';



interface Lead {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    const fetchLeads = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('leads').select('id, name, email').limit(10);
      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }
      setLeads(data || []);
      setTotalLeads(data?.length || 0);
      setLoading(false);
    };

    fetchLeads();

    let channel: RealtimeChannel | undefined;
    if (supabase) {
      channel = supabase
        .channel('leads')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
          fetchLeads();
        })
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard - LeadSpark</title>
      </Head>
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="mb-6">Welcome back!</p>
        <Card>
          <CardHeader>
            <CardTitle>Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{totalLeads}</p>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {leads.map((lead) => (
              <LeadCard key={lead.id} name={lead.name} email={lead.email} />
            ))}
            {leads.length === 0 && (
              <p>No recent leads found.</p>
            )}
          </CardContent>
        </Card>
        <Button className="mt-4">
          <Link href="/leads">View All Leads</Link>
        </Button>
      </main>
    </Layout>
  );
}