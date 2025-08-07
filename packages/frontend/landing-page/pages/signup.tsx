// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Tenant {
  id: string;
  name: string;
  owner_id: string;
  config_json: {
    system_prompt?: string;
    elevenlabs_voice?: string;
    notification_emails?: string[];
    calendar_integration?: boolean;
    llm_consensus_enabled?: boolean;
    llm_consensus_strategy?: string;
  };
  subscription_status: 'active' | 'trialing' | 'canceled';
  created_at: string;
  updated_at?: string;
}

interface Voice {
  id: string;
  name: string;
  description: string;
}

interface SetupStep1Data {
  companyName: string;
  systemPrompt: string;
  voiceId: string;
}

interface SetupStep1Props {
  user: User;
  onNext: (data: SetupStep1Data) => void;
  loading: boolean;
}

interface SetupStep2Props {
  user: User;
  tenant: Tenant;
  onNext: (data: {}) => void;
  loading: boolean;
}

export default function Dashboard(): JSX.Element {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async (): Promise<void> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Check if user has completed onboarding
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id',