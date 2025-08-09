// pages/_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@leadspark/styles/dist/main.css';

import { SupabaseProvider } from '../hooks/useSupabase';

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
