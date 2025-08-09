// packages/frontend/portal/hooks/useSupabase.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthError, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

/**
 * What the app expects to get from useSupabase()
 * - includes `supabase` client, user/session, auth helpers, and multi-tenant helpers
 */
export interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  getTenantId: () => string | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

/** Use the full context (client + user + helpers) */
export const useSupabase = (): SupabaseContextType => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within a SupabaseProvider');
  return ctx;
};

/** Shorthand when a component only needs the client */
export const useSupabaseClient = () => useSupabase().supabase;

/**
 * Provider: wires up session, user and exposes helpers.
 * Wrap your app with this in pages/_app.tsx.
 */
export const SupabaseProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session + auth listener
  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
        });

        unsubscribe = () => sub.subscription.unsubscribe();
      } catch (err) {
        console.error('Supabase init error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => unsubscribe();
  }, []);

  const signIn: SupabaseContextType['signIn'] = async (email, password) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (e) {
      console.error('signIn error:', e);
      return { error: e as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut: SupabaseContextType['signOut'] = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTenantId = (): string | null => {
    // prefer user_metadata, fall back to app_metadata for older projects
    const t =
      user?.user_metadata?.tenant_id ??
      // @ts-expect-error older projects sometimes stash it here
      user?.app_metadata?.tenant_id ??
      null;

    if (!t && user) console.warn('No tenant_id found for user:', user.id);
    return t;
  };

  const value: SupabaseContextType = useMemo(
    () => ({
      supabase,
      user,
      session,
      loading,
      isAuthenticated: !!user && !!session,
      signIn,
      signOut,
      getTenantId,
    }),
    [user, session, loading]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

/**
 * HOC for pages that require authentication
 * Redirects to landing login preserving the current URL.
 */
export const withAuth = (Wrapped: React.ComponentType<any>) => {
  const Authenticated: React.FC<any> = (props) => {
    const { user, loading } = useSupabase();

    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      );
    }

    if (!user) {
      if (typeof window !== 'undefined') {
        const here = encodeURIComponent(window.location.href);
        window.location.href = `${process.env.NEXT_PUBLIC_LANDING_URL}/login?redirect=${here}`;
      }
      return null;
    }

    return <Wrapped {...props} />;
  };

  Authenticated.displayName = `withAuth(${Wrapped.displayName || Wrapped.name || 'Component'})`;
  return Authenticated;
};

/**
 * Authenticated fetch with Bearer + X-Tenant-ID headers prefilled.
 */
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
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
    return res;
  };
};

/**
 * Supabase RLS helpers (scoped by tenant automatically).
 */
export const useSupabaseQuery = () => {
  const { user, getTenantId, supabase } = useSupabase();

  const query = (table: string) => {
    if (!user) throw new Error('User not authenticated');
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('No tenant ID available');
    return supabase.from(table).select('*').eq('tenant_id', tenantId);
  };

  const insert = (table: string, data: Record<string, any>) => {
    if (!user) throw new Error('User not authenticated');
    const tenantId = getTenantId();
    if (!tenantId) throw new Error('No tenant ID available');
    return supabase.from(table).insert({ ...data, tenant_id: tenantId });
  };

  return { query, insert, supabase };
};
