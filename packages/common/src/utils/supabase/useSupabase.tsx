import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User, SupabaseClient } from '@supabase/supabase-js';

import { createBrowserClient } from '@supabase/ssr';

// Conditional import to avoid server-side processing issues
let getTenantId: ((user: User | null) => string | null) | null = null;

// Only import tenant function in browser environment
if (typeof window !== 'undefined') {
  try {
    getTenantId = require('./tenant').getTenantId;
  } catch (error) {
    console.warn('Could not load tenant function:', error);
    getTenantId = () => null;
  }
} else {
  // Server-side fallback
  getTenantId = () => null;
}

type SupabaseContextValue = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  tenantId: string | null;
  loading: boolean;
  signOut: () => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

// Create browser client using SSR package
function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess ?? null);
      setUser(sess?.user ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Use the conditionally loaded getTenantId function
  const tenantId = useMemo<string | null>(() => {
    if (getTenantId) {
      return getTenantId(user) ?? null;
    }
    return null;
  }, [user]);

  const signOut = async () => {
    setSession(null);
    setUser(null);
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  };

  const value: SupabaseContextValue = {
    supabase,
    session,
    user,
    tenantId,
    loading,
    signOut,
    signInWithOtp,
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within <SupabaseProvider>');
  return ctx;
}

export function useSupabaseClient() {
  return useSupabase().supabase;
}