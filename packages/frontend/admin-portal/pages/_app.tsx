// pages/_app.tsx
import '../../../styles/main.scss'
import '../../../styles/_reset.scss';
import '../../../styles/_layout.scss';

import type { AppProps } from 'next/app'

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}