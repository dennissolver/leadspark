// packages/frontend/portal/pages/dashboard.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/layout';
import LeadCard from '../components/LeadCard';
import { useSupabase } from '../hooks/useSupabase';
import { dbHelpers, type Lead } from '../lib/supabaseClient';
import styles from './dashboard.module.scss';

interface DashboardStats {
  totalLeads: number;
  weekLeads: number;
  convertedLeads: number;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, tenantId, loading } = useSupabase();

  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    weekLeads: 0,
    convertedLeads: 0,
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth + tenant gating
  useEffect(() => {
    if (loading) return;

    // Not signed in -> login
    if (!user) {
      setRedirecting(true);
      router.replace('/login');
      return;
    }

    // Signed in but no tenant -> onboarding
    if (!tenantId) {
      setRedirecting(true);
      router.replace('/onboarding');
      return;
    }
  }, [loading, user, tenantId, router]);

  // Data load once we have a tenant and we're not redirecting
  useEffect(() => {
    const canLoad = !loading && !!user && !!tenantId && !redirecting;
    if (!canLoad) return;

    const fetchDashboardData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        const dashboardStats = await dbHelpers.getDashboardStats(tenantId as string);
        setStats(dashboardStats);

        const allLeads = await dbHelpers.getLeads(tenantId as string);
        setRecentLeads(allLeads.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [loading, user, tenantId, redirecting]);

  const getConversionRate = () => {
    if (stats.totalLeads === 0) return 0;
    return Math.round((stats.convertedLeads / stats.totalLeads) * 100);
  };

  const getGrowthRate = () => {
    // naive baseline: avg per week across ~12 weeks
    const averageWeekly = stats.totalLeads / 12;
    if (averageWeekly === 0) return 0;
    return Math.round(((stats.weekLeads - averageWeekly) / averageWeekly) * 100);
  };

  // Unified loading UI (auth check / redirect / initial data)
  if (loading || redirecting || loadingData) {
    return (
      <Layout title="Dashboard - LeadSpark Portal">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>
            {redirecting ? 'Taking you to the right place…' : 'Loading dashboard…'}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard - LeadSpark Portal">
      <Head>
        <title>Dashboard - LeadSpark Portal</title>
        <meta
          name="description"
          content="Your LeadSpark dashboard with lead analytics and recent activity"
        />
      </Head>

      <div className={styles.dashboardContainer}>
        {/* Header */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.welcomeText}>
              Welcome back! Here&apos;s what&apos;s happening with your leads.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/leads" className={styles.viewAllButton}>
              View All Leads
            </Link>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Stats */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{stats.totalLeads}</h3>
                <p className={styles.statLabel}>Total Leads</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📈</div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{stats.weekLeads}</h3>
                <p className={styles.statLabel}>This Week</p>
                <div
                  className={`${styles.statTrend} ${
                    getGrowthRate() >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {getGrowthRate() >= 0 ? '↗' : '↘'} {Math.abs(getGrowthRate())}%
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{stats.convertedLeads}</h3>
                <p className={styles.statLabel}>Converted</p>
                <div className={styles.statPercentage}>
                  {getConversionRate()}% conversion rate
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>💬</div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>24</h3>
                <p className={styles.statLabel}>Active Conversations</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Leads</h2>
            <Link href="/leads" className={styles.sectionAction}>
              View All
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <h3 className={styles.emptyTitle}>No leads yet</h3>
              <p className={styles.emptyText}>
                Your AI assistant is ready to capture leads from your website. Make sure your
                widget is properly installed.
              </p>
              <Link href="/settings" className={styles.setupButton}>
                Widget Setup
              </Link>
            </div>
          ) : (
            <div className={styles.leadsGrid}>
              {recentLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
          </div>

          <div className={styles.actionsGrid}>
            <Link href="/knowledge-base/upload" className={styles.actionCard}>
              <div className={styles.actionIcon}>📚</div>
              <div className={styles.actionContent}>
                <h3 className={styles.actionTitle}>Update Knowledge Base</h3>
                <p className={styles.actionDescription}>
                  Add new content to improve your AI&apos;s responses
                </p>
              </div>
            </Link>

            <Link href="/settings/ai-config" className={styles.actionCard}>
              <div className={styles.actionIcon}>🤖</div>
              <div className={styles.actionContent}>
                <h3 className={styles.actionTitle}>Configure AI</h3>
                <p className={styles.actionDescription}>
                  Customize your assistant&apos;s personality and responses
                </p>
              </div>
            </Link>

            <Link href="/settings/voice" className={styles.actionCard}>
              <div className={styles.actionIcon}>🎤</div>
              <div className={styles.actionContent}>
                <h3 className={styles.actionTitle}>Voice Settings</h3>
                <p className={styles.actionDescription}>
                  Choose and customize your AI&apos;s voice
                </p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default DashboardPage;

