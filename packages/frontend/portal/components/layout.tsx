import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import { useSupabase } from '@leadspark/common/src/utils/supabase/useSupabase';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'LeadSpark Portal',
  description = 'Manage your leads and AI voice assistant'
}) => {
  const router = useRouter();
  const { user, loading } = useSupabase();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p className="loadingText">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user && router.pathname !== '/') {
    router.push(`${process.env.NEXT_PUBLIC_LANDING_URL}/login?redirect=${process.env.NEXT_PUBLIC_PORTAL_URL}${router.pathname}`);
    return (
      <div className="loadingContainer">
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p className="loadingText">Redirecting...</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="layoutContainer">
        {/* Mobile Menu Button */}
        <button
          className="mobileMenuButton"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger"></span>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
        </button>

        {/* Sidebar */}
        <div className={`sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}>
          <Sidebar />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="mobileOverlay"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="mainContent">
          <div className="contentWrapper">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default Layout;