import '@leadspark/styles/dist/main.css';
import type { AppProps } from 'next/app';
import { SupabaseProvider } from '../hooks/useSupabase';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <Component {...pageProps} />
    </SupabaseProvider>
  );
}
