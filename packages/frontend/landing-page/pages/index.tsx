// File: packages/frontend/landing-page/pages/index.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>LeadSpark – Property Investment Voice Assistant</title>
      </Head>
      <main>
        <h1>Welcome to LeadSpark</h1>
        <p>Let Jess, our AI Voice Agent, guide your property investment journey.</p>
        <Link href="/login">          {/* ← CHANGE THIS */}
          <button>Admin Login</button>
        </Link>
        <Link href="/pricing">        {/* ← ADD THIS */}
          <button>Get Started</button>
        </Link>
      </main>
    </>
  );
}