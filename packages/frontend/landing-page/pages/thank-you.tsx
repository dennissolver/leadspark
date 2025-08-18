import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const ThankYouPage: React.FC = () => {
  // This is the base URL for the portal application
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://leadspark-tenant.vercel.app';

  return (
    <div className="page">
      <Head>
        <title>Thank You for Signing Up</title>
      </Head>

      <div className="container">
        <h1 className="title">Thank You for Signing Up!</h1>
        <p className="subtitle">
          We've sent a confirmation link to your email address.
        </p>
        <p className="description">
          Please check your inbox and click the link to confirm your account and activate your free trial.
        </p>
        <div className="actions">
          <Link href={`${portalUrl}/login`} className="button">
            Go to Login
          </Link>
          <Link href="/" className="link">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
