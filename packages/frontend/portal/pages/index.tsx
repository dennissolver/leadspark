import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSupabase } from '../hooks/useSupabase';
import styles from './index.module.scss';

const IndexPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useSupabase();

  useEffect(() => {
    // Wait for authentication check to complete
    if (loading) return;

    if (!user) {
      // Redirect to the local /login page within the portal app.
      router.push('/login');
      return;
    }

    // User is authenticated, redirect to dashboard
    router.push('/dashboard');
  }, [user, loading, router]);

  // Show loading state while redirecting
  return (
    <>
      <Head>
        <title>LeadSpark Portal</title>
        <meta name="description" content="Access your LeadSpark portal dashboard" />
      </Head>

      <div className={styles.indexContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.logoContainer}>
            <span className={styles.logo}>⚡</span>
            <h1 className={styles.brandName}>LeadSpark</h1>
          </div>

          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>

          <p className={styles.loadingText}>
            {loading ? 'Checking authentication...' : 'Redirecting...'}
          </p>

          {!loading && !user && (
            <div className={styles.redirectInfo}>
              <p className={styles.redirectText}>
                Taking you to the login page...
              </p>
              <a
                href="/login" // Redirect to the local login path
                className={styles.manualLink}
              >
                Click here if you're not redirected automatically
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IndexPage;
