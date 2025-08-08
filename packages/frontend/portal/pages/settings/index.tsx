import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import styles from './index.module.scss';

interface SettingCard {
  title: string;
  description: string;
  href: string;
  icon: string;
  status?: 'active' | 'inactive' | 'warning';
}

const SettingsPage: React.FC = () => {
  const router = useRouter();

  const settingCards: SettingCard[] = [
    {
      title: 'AI Configuration',
      description: 'Customize your AI assistant\'s behavior, system prompts, and conversation flow',
      href: '/settings/ai-config',
      icon: '🤖',
      status: 'active'
    },
    {
      title: 'Voice Settings',
      description: 'Configure voice options, ElevenLabs integration, and audio preferences',
      href: '/settings/voice',
      icon: '🎙️',
      status: 'active'
    },
    {
      title: 'Notifications',
      description: 'Manage email alerts, SMS notifications, and lead capture settings',
      href: '/settings/notifications',
      icon: '🔔',
      status: 'active'
    }
  ];

  return (
    <Layout>
      <div className={styles.settingsContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>
            Configure your Leadspark instance to match your business needs
          </p>
        </div>

        <div className={styles.settingsGrid}>
          {settingCards.map((card, index) => (
            <Link href={card.href} key={index} className={styles.settingCard}>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.icon}>{card.icon}</span>
                  </div>
                  <div className={styles.statusIndicator}>
                    <span className={`${styles.status} ${styles[card.status || 'inactive']}`}>
                      {card.status === 'active' && '●'}
                      {card.status === 'inactive' && '○'}
                      {card.status === 'warning' && '⚠'}
                    </span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p className={styles.cardDescription}>{card.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.configureText}>Configure →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.quickActions}>
          <h2 className={styles.quickActionsTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>⚡</span>
              Test Voice Assistant
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>🔄</span>
              Reset to Defaults
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>📊</span>
              View Usage Statistics
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>💾</span>
              Export Configuration
            </button>
          </div>
        </div>

        <div className={styles.systemInfo}>
          <h2 className={styles.systemInfoTitle}>System Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Plan</span>
              <span className={styles.infoValue}>Professional</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>API Status</span>
              <span className={`${styles.infoValue} ${styles.statusActive}`}>Active</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Last Updated</span>
              <span className={styles.infoValue}>2 hours ago</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Widget Version</span>
              <span className={styles.infoValue}>v2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;