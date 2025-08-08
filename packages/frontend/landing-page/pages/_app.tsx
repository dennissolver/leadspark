// pages/_app.tsx
import '@leadspark/styles/dist/main.css'; // ✅ The only import needed
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}