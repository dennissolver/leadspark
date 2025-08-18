import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import React from 'react';

// Shared provider so pages can call useSupabase()
import { SupabaseProvider } from '@leadspark/common/src/utils/supabase/useSupabase';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Widget bundle on every page */}
      <Script
        src="/leadspark-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          if (!window?.LeadSparkWidget) {
            console.error('LeadSparkWidget global not found after script load');
          }
        }}
      />

      {/* Initialize widget */}
      <Script id="leadspark-widget-init" strategy="afterInteractive">
        {`
          (function () {
            function boot() {
              if (window.LeadSparkWidget && typeof window.LeadSparkWidget.init === 'function') {
                window.LeadSparkWidget.init({
                  position: 'bottom-right',
                  accentColor: '#2563eb',
                  zIndex: 2147483000
                });
              } else {
                setTimeout(boot, 200);
              }
            }
            boot();
          })();
        `}
      </Script>

      {/* Providers */}
      <SupabaseProvider>
        <Component {...pageProps} />
      </SupabaseProvider>
    </>
  );
}
