import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useSupabase from '../hooks/useSupabase';
import styles from './Sidebar.module.scss';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useSupabase();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: '👥',
      badge: 5, // This would come from actual data
    },
    {
      name: 'Knowledge Base',
      href: '/knowledge-base',
      icon: '📚',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: '⚙️',
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to landing page login
      window.location.href = `${process.env.NEXT_PUBLIC_LANDING_URL}/login`;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Sidebar Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          {!isCollapsed && <span className={styles.logoText}>LeadSpark</span>}
        </div>
        <button
          className={styles.collapseButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.navigation}>
        <ul className={styles.navList}>
          {navigation.map((item) => (
            <li key={item.name} className={styles.navItem}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${
                  isActive(item.href) ? styles.active : ''
                }`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className={styles.navText}>{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={styles.badge}>{item.badge}</span>
                    )}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className={styles.quickStats}>
          <h3 className={styles.statsTitle}>Quick Stats</h3>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Leads</span>
            <span className={styles.statValue}>24</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>This Week</span>
            <span className={styles.statValue}>7</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Converted</span>
            <span className={styles.statValue}>3</span>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className={styles.userProfile}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {user?.user_metadata?.full_name || 'User'}
              </div>
              <div className={styles.userEmail}>
                {user?.email || 'user@example.com'}
              </div>
            </div>
          )}
        </div>

        <div className={styles.userActions}>
          {!isCollapsed && (
            <>
              <Link href="/settings" className={styles.settingsLink}>
                <span className={styles.settingsIcon}>⚙️</span>
                Settings
              </Link>
              <button onClick={handleSignOut} className={styles.signOutButton}>
                <span className={styles.signOutIcon}>↗️</span>
                Sign Out
              </button>
            </>
          )}
          {isCollapsed && (
            <button
              onClick={handleSignOut}
              className={styles.signOutIconOnly}
              title="Sign Out"
            >
              ↗️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;