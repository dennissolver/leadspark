// packages/frontend/portal/pages/settings/notifications.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layout';
import { useSupabase } from '../../hooks/useSupabase';
import styles from './notifications.module.scss';

interface NotificationConfig {
  emailNotifications: {
    enabled: boolean;
    newLead: boolean;
    leadUpdate: boolean;
    systemAlerts: boolean;
    weeklyReport: boolean;
    emailAddresses: string[];
  };
  smsNotifications: {
    enabled: boolean;
    newLead: boolean;
    urgentAlerts: boolean;
    phoneNumbers: string[];
  };
  slackIntegration: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    newLead: boolean;
    leadUpdate: boolean;
  };
  webhookIntegration: {
    enabled: boolean;
    url: string;
    secret: string;
    events: string[];
  };
  leadCapture: {
    autoResponse: boolean;
    responseDelay: number;
    thankYouMessage: string;
    followUpEmails: boolean;
  };
}

const NotificationsPage: React.FC = () => {
  const { supabase, tenantId } = useSupabase(); // ✅ use tenantId instead of user?.tenant_id
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);

  const [config, setConfig] = useState<NotificationConfig>({
    emailNotifications: {
      enabled: true,
      newLead: true,
      leadUpdate: true,
      systemAlerts: true,
      weeklyReport: false,
      emailAddresses: []
    },
    smsNotifications: {
      enabled: false,
      newLead: false,
      urgentAlerts: false,
      phoneNumbers: []
    },
    slackIntegration: {
      enabled: false,
      webhookUrl: '',
      channel: '',
      newLead: false,
      leadUpdate: false
    },
    webhookIntegration: {
      enabled: false,
      url: '',
      secret: '',
      events: []
    },
    leadCapture: {
      autoResponse: true,
      responseDelay: 5,
      thankYouMessage: "Thank you for your interest! We'll be in touch shortly.",
      followUpEmails: true
    }
  });

  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const availableEvents = [
    { value: 'lead.created', label: 'New Lead Created' },
    { value: 'lead.updated', label: 'Lead Information Updated' },
    { value: 'conversation.completed', label: 'Conversation Completed' },
    { value: 'appointment.scheduled', label: 'Appointment Scheduled' },
    { value: 'system.error', label: 'System Error' }
  ];

  useEffect(() => {
    if (!tenantId) return;
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('config_json')
        .eq('id', tenantId) // ✅
        .single();

      if (error) throw error;

      if (data?.config_json?.notifications) {
        setConfig(prev => ({ ...prev, ...data.config_json.notifications }));
      }
    } catch (error) {
      console.error('Error loading notification configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('config_json')
        .eq('id', tenantId) // ✅
        .single();

      if (fetchError) throw fetchError;

      const updatedConfig = {
        ...(data?.config_json ?? {}),
        notifications: config
      };

      const { error } = await supabase
        .from('tenants')
        .update({
          config_json: updatedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId); // ✅

      if (error) throw error;

      alert('Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving notification configuration:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addEmailAddress = () => {
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setConfig(prev => {
        if (prev.emailNotifications.emailAddresses.includes(newEmail)) return prev;
        return {
          ...prev,
          emailNotifications: {
            ...prev.emailNotifications,
            emailAddresses: [...prev.emailNotifications.emailAddresses, newEmail]
          }
        };
      });
      setNewEmail('');
    }
  };

  const removeEmailAddress = (email: string) => {
    setConfig(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        emailAddresses: prev.emailNotifications.emailAddresses.filter(e => e !== email)
      }
    }));
  };

  const addPhoneNumber = () => {
    if (newPhone && /^[\+]?[\d\s\-\(\)]+$/.test(newPhone)) {
      setConfig(prev => {
        if (prev.smsNotifications.phoneNumbers.includes(newPhone)) return prev;
        return {
          ...prev,
          smsNotifications: {
            ...prev.smsNotifications,
            phoneNumbers: [...prev.smsNotifications.phoneNumbers, newPhone]
          }
        };
      });
      setNewPhone('');
    }
  };

  const removePhoneNumber = (phone: string) => {
    setConfig(prev => ({
      ...prev,
      smsNotifications: {
        ...prev.smsNotifications,
        phoneNumbers: prev.smsNotifications.phoneNumbers.filter(p => p !== phone)
      }
    }));
  };

  const toggleWebhookEvent = (value: string, checked: boolean) => {
    setConfig(prev => {
      const set = new Set(prev.webhookIntegration.events);
      checked ? set.add(value) : set.delete(value);
      return {
        ...prev,
        webhookIntegration: { ...prev.webhookIntegration, events: Array.from(set) }
      };
    });
  };

  const testEmailNotification = async () => {
    setTestingEmail(true);
    try {
      await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', config: config.emailNotifications })
      });
      alert('Test email sent successfully!');
    } catch {
      alert('Failed to send test email.');
    } finally {
      setTestingEmail(false);
    }
  };

  const testSMSNotification = async () => {
    setTestingSMS(true);
    try {
      await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sms', config: config.smsNotifications })
      });
      alert('Test SMS sent successfully!');
    } catch {
      alert('Failed to send test SMS.');
    } finally {
      setTestingSMS(false);
    }
  };

  const testSlackIntegration = async () => {
    setTestingSlack(true);
    try {
      await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'slack', config: config.slackIntegration })
      });
      alert('Test Slack message sent successfully!');
    } catch {
      alert('Failed to send test Slack message.');
    } finally {
      setTestingSlack(false);
    }
  };

  if (!tenantId || loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading notification settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.notificationsContainer}>
        <div className={styles.header}>
          <Link href="/settings" className={styles.backButton}>
            ← Back to Settings
          </Link>
          <h1 className={styles.title}>Notification Settings</h1>
          <p className={styles.subtitle}>
            Configure how and when you receive alerts about leads and system events
          </p>
        </div>

        <div className={styles.sectionsGrid}>
          {/* Email */}
          {/* ...existing Email section from your snippet stays unchanged... */}

          {/* SMS */}
          {/* ...existing SMS section from your snippet stays unchanged... */}

          {/* Slack */}
          {/* ...existing Slack section from your snippet stays unchanged... */}

          {/* Webhook Integration */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Webhook Integration</h2>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  id="webhookEnabled"
                  checked={config.webhookIntegration.enabled}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      webhookIntegration: { ...prev.webhookIntegration, enabled: e.target.checked }
                    }))
                  }
                />
                <label htmlFor="webhookEnabled" className={styles.switch}>
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={`${styles.sectionContent} ${!config.webhookIntegration.enabled ? styles.disabled : ''}`}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Webhook URL</label>
                <input
                  type="url"
                  value={config.webhookIntegration.url}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      webhookIntegration: { ...prev.webhookIntegration, url: e.target.value }
                    }))
                  }
                  placeholder="https://your-server.com/webhook"
                  className={styles.input}
                  disabled={!config.webhookIntegration.enabled}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Secret Key (Optional)</label>
                <input
                  type="text"
                  value={config.webhookIntegration.secret}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      webhookIntegration: { ...prev.webhookIntegration, secret: e.target.value }
                    }))
                  }
                  placeholder="Optional secret for webhook verification"
                  className={styles.input}
                  disabled={!config.webhookIntegration.enabled}
                />
              </div>

              <div className={styles.eventsList}>
                <label className={styles.label}>Events to Send</label>
                {availableEvents.map((event) => (
                  <div key={event.value} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      id={`webhook-${event.value}`}
                      checked={config.webhookIntegration.events.includes(event.value)}
                      onChange={(e) => toggleWebhookEvent(event.value, e.target.checked)}
                      disabled={!config.webhookIntegration.enabled}
                    />
                    <label htmlFor={`webhook-${event.value}`}>{event.label}</label>
                  </div>
                ))}
              </div>

              <button
                onClick={async () => {
                  try {
                    await fetch('/api/test-notification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'webhook',
                        config: config.webhookIntegration
                      })
                    });
                    alert('Test webhook sent!');
                  } catch {
                    alert('Failed to send test webhook.');
                  }
                }}
                className={styles.testButton}
                disabled={
                  !config.webhookIntegration.enabled ||
                  !config.webhookIntegration.url
                }
              >
                Send Test Webhook
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className={styles.footerActions}>
          <button
            onClick={saveConfig}
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
