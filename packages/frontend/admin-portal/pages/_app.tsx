import type { AppProps } from "next/app";
import Script from "next/script";
import { SupabaseProvider } from "../src/lib/supabase";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <Component {...pageProps} />
      <Script
        id="leadspark-widget"
        strategy="afterInteractive"
        src={process.env.NEXT_PUBLIC_LEADSPARK_WIDGET_URL || "/leadspark-widget.js"}
        onLoad={() => {
          // bundle exports 'LeadsparkWidget' (lowercase s). Fall back to old casing if needed.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const w = (window as any).LeadsparkWidget || (window as any).LeadSparkWidget;
          if (!w) console.error("LeadsparkWidget global not found after script load");
        }}
      />
    </SupabaseProvider>
  );
}
