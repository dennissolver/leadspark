// pages/_app.tsx
import '../../../styles/main.scss'; // ✅ The only import needed
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}