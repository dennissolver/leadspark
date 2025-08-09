import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import s from '../styles/thank-you.module.scss'; // You will need to create this SCSS file

const ThankYouPage: React.FC = () => {
  return (
    <div className={s.page}>
      <Head>
        <title>Thank You for Signing Up</title>
      </Head>

      <div className={s.container}>
        <h1 className={s.title}>Thank You for Signing Up!</h1>
        <p className={s.subtitle}>
          We've sent a confirmation link to your email address.
        </p>
        <p className={s.description}>
          Please check your inbox and click the link to confirm your account and activate your free trial.
        </p>
        <div className={s.actions}>
          <Link href="https://leadspark-tenant.vercel.app/login" className={s.button}>
            Go to Login
          </Link>
          <Link href="/" className={s.link}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
