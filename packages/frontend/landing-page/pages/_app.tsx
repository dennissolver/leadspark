import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import React from 'react';

// Shared provider so pages can call useSupabase()
import { SupabaseProvider } from '@leadspark/common/src/utils/supabase/useSupabase';

// Extend the Window interface to include LeadSparkWidget
declare global {
  interface Window {
    LeadSparkWidget?: {
      init: (config: {
        position: string;
        accentColor: string;
        zIndex: number;
      }) => void;
    };
  }
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Combined script for widget loading and initialization */}
      <Script
        src="/leadspark-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          // A resilient bootstrapper that retries until the widget is available
          const bootstrapper = () => {
            if (window.LeadSparkWidget && typeof window.LeadSparkWidget.init === 'function') {
              window.LeadSparkWidget.init({
                position: 'bottom-right',
                accentColor: '#2563eb',
                zIndex: 2147483000
              });
              console.log('Widget successfully initialized.');
            } else {
              // Retry in 50ms to account for asynchronous loading
              setTimeout(bootstrapper, 50);
            }
          };
          bootstrapper();
        }}
      />

      {/* Providers */}
      <SupabaseProvider>
        <Component {...pageProps} />
      </SupabaseProvider>
    </>
  );
}