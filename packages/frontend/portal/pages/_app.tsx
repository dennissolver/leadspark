import React, { createContext, useContext } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useSupabaseClient } from '../hooks/useSupabase';

// Import centralized styles
import '@leadspark/styles/dist/main.css';

// Supabase Context Provider
interface SupabaseContextType {
  user: any;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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

// Supabase Provider Component
const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabaseClient = useSupabaseClient();

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </SupabaseProvider>
  );
}