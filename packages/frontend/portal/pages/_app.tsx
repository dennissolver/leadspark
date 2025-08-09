// pages/_app.tsx
import React, { createContext, useContext } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

// central stylesheet from your styles package
import '@leadspark/styles/dist/main.css';

// pull in the hook/provider you implemented in hooks/useSupabase
import {
  SupabaseProvider,        // the provider that actually initializes session/client
  useSupabase as useSupabaseFromHook,
} from '../hooks/useSupabase';

// Re‑export the hook so existing imports keep working (optional)
export const useSupabase = useSupabaseFromHook;

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
