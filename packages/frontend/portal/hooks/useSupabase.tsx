import React, { useState, useEffect, createContext, useContext } from 'react';
import type { User, Session, AuthError, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// ---- Types ----
export interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  getTenantId: () => string | null;
}

// ---- Context ----
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = (): SupabaseContextType => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within a SupabaseProvider');
  return ctx;
};

// Optional: separate hook if components only need the client
export const useSupabaseClient = () => useSupabase().supabase;

// ---- Provider ----
export const SupabaseProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
          setSession(sess);
          setUser(sess?.user ?? null);
          setLoading(false);
        });

        unsub = () => subscription.unsubscribe();
      } catch (e) {
        console.error('Error getting initial session:', e);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => unsub();
  }, []);

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const getTenantId = (): string | null => {
    const t =
      user?.user_metadata?.tenant_id ??
      // @ts-expect-error older projects sometimes stash it here
      user?.app_metadata?.tenant_id ??
      null;
    return t;
  };

  const value: SupabaseContextType = {
    supabase,
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signOut,
    signIn,
    getTenantId,
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

// ---- Extras (unchanged APIs) ----
export const withAuth = (Wrapped: React.ComponentType<any>) => {
  return function Authenticated(props: any) {
    const { user, loading } = useSupabase();

    if (loading) {
      return (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
          <div>Loading...</div>
        </div>
      );
    }

    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = `${process.env.NEXT_PUBLIC_LANDING_URL}/login?redirect=${window.location.href}`;
      }
      return null;
    }

    return <Wrapped {...props} />;
  };
};

export const useAuthenticatedFetch = () => {
  const { session, getTenantId } = useSupabase();

  return async (url: string, options: RequestInit = {}) => {
    if (!session?.access_token) throw new Error('No access token available');
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('No tenant ID available');

    const headers = {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res;
  };
};

export const useSupabaseQuery = () => {
  const { user, getTenantId, supabase } = useSupabase();

  const query = (table: string) => {
    if (!user) throw new Error('User not authenticated');
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('No tenant ID available');
    return supabase.from(table).select('*').eq('tenant_id', tenantId);
  };

  const insert = (table: string, data: any) => {
    if (!user) throw new Error('User not authenticated');
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('No tenant ID available');
    return supabase.from(table).insert({ ...data, tenant_id: tenantId });
  };

  return { query, insert, supabase };
};
