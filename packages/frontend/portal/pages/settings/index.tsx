import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';

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
      <div className="settingsContainer">
        <div className="header">
          <h1 className="title">Settings</h1>
          <p className="subtitle">
            Configure your Leadspark instance to match your business needs
          </p>
        </div>

        <div className="settingsGrid">
          {settingCards.map((card, index) => (
            <Link href={card.href} key={index} className="settingCard">
              <div className="cardContent">
                <div className="cardHeader">
                  <div className="iconWrapper">
                    <span className="icon">{card.icon}</span>
                  </div>
                  <div className="statusIndicator">
                    <span className={`${card.status || "inactive"}`}>
                      {card.status === 'active' && '●'}
                      {card.status === 'inactive' && '○'}
                      {card.status === 'warning' && '⚠'}
                    </span>
                  </div>
                </div>

                <div className="cardBody">
                  <h3 className="cardTitle">{card.title}</h3>
                  <p className="cardDescription">{card.description}</p>
                </div>

                <div className="cardFooter">
                  <span className="configureText">Configure →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="quickActions">
          <h2 className="quickActionsTitle">Quick Actions</h2>
          <div className="actionsGrid">
            <button className="actionButton">
              <span className="actionIcon">⚡</span>
              Test Voice Assistant
            </button>
            <button className="actionButton">
              <span className="actionIcon">🔄</span>
              Reset to Defaults
            </button>
            <button className="actionButton">
              <span className="actionIcon">📊</span>
              View Usage Statistics
            </button>
            <button className="actionButton">
              <span className="actionIcon">💾</span>
              Export Configuration
            </button>
          </div>
        </div>

        <div className="systemInfo">
          <h2 className="systemInfoTitle">System Information</h2>
          <div className="infoGrid">
            <div className="infoItem">
              <span className="infoLabel">Plan</span>
              <span className="infoValue">Professional</span>
            </div>
            <div className="infoItem">
              <span className="infoLabel">API Status</span>
              <span className={`statusActive}`}>Active</span>
            </div>
            <div className="infoItem">
              <span className="infoLabel">Last Updated</span>
              <span className="infoValue">2 hours ago</span>
            </div>
            <div className="infoItem">
              <span className="infoLabel">Widget Version</span>
              <span className="infoValue">v2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;

