import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  getTenantId: () => string | null;
  isAuthenticated: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const useSupabaseClient = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle auth events
      if (event === 'SIGNED_IN') {
        console.log('User signed in');
      }
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Get tenant ID from user metadata
  const getTenantId = (): string | null => {
    if (!user) return null;

    // Try to get tenant_id from user metadata
    const tenantId = user.user_metadata?.tenant_id ||
                    user.app_metadata?.tenant_id ||
                    null;

    if (!tenantId) {
      console.warn('No tenant_id found for user:', user.id);
    }

    return tenantId;
  };

  const isAuthenticated = !!user && !!session;

  return {
    user,
    session,
    loading,
    signOut,
    signIn,
    getTenantId,
    isAuthenticated,
  };
};

// HOC for pages that require authentication
export const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  return function AuthenticatedComponent(props: any) {
    const { user, loading } = useSupabase();

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <div>Loading...</div>
        </div>
      );
    }

    if (!user) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = `${process.env.NEXT_PUBLIC_LANDING_URL}/login?redirect=${window.location.href}`;
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

// Custom hook for making authenticated API requests
export const useAuthenticatedFetch = () => {
  const { session, getTenantId } = useSupabase();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error('No tenant ID available');
    }

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  };

  return authenticatedFetch;
};

// Custom hook for Supabase RLS queries
export const useSupabaseQuery = () => {
  const { user, getTenantId } = useSupabase();

  const query = (tableName: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error('No tenant ID available');
    }

    // Return a Supabase query builder with tenant filtering
    return supabase
      .from(tableName)
      .select('*')
      .eq('tenant_id', tenantId);
  };

  const insert = (tableName: string, data: any) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error('No tenant ID available');
    }

    // Add tenant_id to the data being inserted
    const dataWithTenant = {
      ...data,
      tenant_id: tenantId,
    };

    return supabase.from(tableName).insert(dataWithTenant);
  };

  return {
    query,
    insert,
    supabase, // For direct access when needed
  };
};