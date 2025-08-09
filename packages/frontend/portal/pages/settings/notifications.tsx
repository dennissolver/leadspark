import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout';
import useSupabase from '../../hooks/useSupabase';
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
  const router = useRouter();
  const { supabase, user } = useSupabase();
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
      thankYouMessage: 'Thank you for your interest! We\'ll be in touch shortly.',
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
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('config_json')
        .eq('id', user?.tenant_id)
        .single();

      if (error) throw error;

      if (data?.config_json?.notifications) {
        setConfig({ ...config, ...data.config_json.notifications });
      }
    } catch (error) {
      console.error('Error loading notification configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('config_json')
        .eq('id', user?.tenant_id)
        .single();

      if (fetchError) throw fetchError;

      const updatedConfig = {
        ...data.config_json,
        notifications: config
      };

      const { error } = await supabase
        .from('tenants')
        .update({
          config_json: updatedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.tenant_id);

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
      if (!config.emailNotifications.emailAddresses.includes(newEmail)) {
        setConfig({
          ...config,
          emailNotifications: {
            ...config.emailNotifications,
            emailAddresses: [...config.emailNotifications.emailAddresses, newEmail]
          }
        });
        setNewEmail('');
      }
    }
  };

  const removeEmailAddress = (email: string) => {
    setConfig({
      ...config,
      emailNotifications: {
        ...config.emailNotifications,
        emailAddresses: config.emailNotifications.emailAddresses.filter(e => e !== email)
      }
    });
  };

  const addPhoneNumber = () => {
    if (newPhone && /^[\+]?[\d\s\-\(\)]+$/.test(newPhone)) {
      if (!config.smsNotifications.phoneNumbers.includes(newPhone)) {
        setConfig({
          ...config,
          smsNotifications: {
            ...config.smsNotifications,
            phoneNumbers: [...config.smsNotifications.phoneNumbers, newPhone]
          }
        });
        setNewPhone('');
      }
    }
  };

  const removePhoneNumber = (phone: string) => {
    setConfig({
      ...config,
      smsNotifications: {
        ...config.smsNotifications,
        phoneNumbers: config.smsNotifications.phoneNumbers.filter(p => p !== phone)
      }
    });
  };

  const testEmailNotification = async () => {
    setTestingEmail(true);
    try {
      await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          config: config.emailNotifications
        })
      });
      alert('Test email sent successfully!');
    } catch (error) {
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
        body: JSON.stringify({
          type: 'sms',
          config: config.smsNotifications
        })
      });
      alert('Test SMS sent successfully!');
    } catch (error) {
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
        body: JSON.stringify({
          type: 'slack',
          config: config.slackIntegration
        })
      });
      alert('Test Slack message sent successfully!');
    } catch (error) {
      alert('Failed to send test Slack message.');
    } finally {
      setTestingSlack(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
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
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Email Notifications</h2>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  id="emailEnabled"
                  checked={config.emailNotifications.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    emailNotifications: { ...config.emailNotifications, enabled: e.target.checked }
                  })}
                />
                <label htmlFor="emailEnabled" className={styles.switch}>
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={`${styles.sectionContent} ${!config.emailNotifications.enabled ? styles.disabled : ''}`}>
              <div className={styles.checkboxList}>
                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="newLeadEmail"
                    checked={config.emailNotifications.newLead}
                    onChange={(e) => setConfig({
                      ...config,
                      emailNotifications: { ...config.emailNotifications, newLead: e.target.checked }
                    })}
                    disabled={!config.emailNotifications.enabled}
                  />
                  <label htmlFor="newLeadEmail">New lead captured</label>
                </div>

                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="leadUpdateEmail"
                    checked={config.emailNotifications.leadUpdate}
                    onChange={(e) => setConfig({
                      ...config,
                      emailNotifications: { ...config.emailNotifications, leadUpdate: e.target.checked }
                    })}
                    disabled={!config.emailNotifications.enabled}
                  />
                  <label htmlFor="leadUpdateEmail">Lead information updated</label>
                </div>

                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="systemAlertsEmail"
                    checked={config.emailNotifications.systemAlerts}
                    onChange={(e) => setConfig({
                      ...config,
                      emailNotifications: { ...config.emailNotifications, systemAlerts: e.target.checked }
                    })}
                    disabled={!config.emailNotifications.enabled}
                  />
                  <label htmlFor="systemAlertsEmail">System alerts and errors</label>
                </div>

                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="weeklyReportEmail"
                    checked={config.emailNotifications.weeklyReport}
                    onChange={(e) => setConfig({
                      ...config,
                      emailNotifications: { ...config.emailNotifications, weeklyReport: e.target.checked }
                    })}
                    disabled={!config.emailNotifications.enabled}
                  />
                  <label htmlFor="weeklyReportEmail">Weekly summary report</label>
                </div>
              </div>

              <div className={styles.emailsList}>
                <h4>Email Addresses</h4>
                <div className={styles.addEmailGroup}>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email address"
                    className={styles.emailInput}
                    disabled={!config.emailNotifications.enabled}
                  />
                  <button
                    onClick={addEmailAddress}
                    className={styles.addButton}
                    disabled={!config.emailNotifications.enabled}
                  >
                    Add
                  </button>
                </div>

                <div className={styles.emailTags}>
                  {config.emailNotifications.emailAddresses.map((email, index) => (
                    <div key={index} className={styles.emailTag}>
                      <span>{email}</span>
                      <button
                        onClick={() => removeEmailAddress(email)}
                        className={styles.removeTag}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={testEmailNotification}
                className={styles.testButton}
                disabled={!config.emailNotifications.enabled || testingEmail || config.emailNotifications.emailAddresses.length === 0}
              >
                {testingEmail ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>SMS Notifications</h2>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  id="smsEnabled"
                  checked={config.smsNotifications.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    smsNotifications: { ...config.smsNotifications, enabled: e.target.checked }
                  })}
                />
                <label htmlFor="smsEnabled" className={styles.switch}>
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={`${styles.sectionContent} ${!config.smsNotifications.enabled ? styles.disabled : ''}`}>
              <div className={styles.checkboxList}>
                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="newLeadSMS"
                    checked={config.smsNotifications.newLead}
                    onChange={(e) => setConfig({
                      ...config,
                      smsNotifications: { ...config.smsNotifications, newLead: e.target.checked }
                    })}
                    disabled={!config.smsNotifications.enabled}
                  />
                  <label htmlFor="newLeadSMS">New lead captured</label>
                </div>

                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="urgentAlertsSMS"
                    checked={config.smsNotifications.urgentAlerts}
                    onChange={(e) => setConfig({
                      ...config,
                      smsNotifications: { ...config.smsNotifications, urgentAlerts: e.target.checked }
                    })}
                    disabled={!config.smsNotifications.enabled}
                  />
                  <label htmlFor="urgentAlertsSMS">Urgent alerts only</label>
                </div>
              </div>

              <div className={styles.phonesList}>
                <h4>Phone Numbers</h4>
                <div className={styles.addPhoneGroup}>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className={styles.phoneInput}
                    disabled={!config.smsNotifications.enabled}
                  />
                  <button
                    onClick={addPhoneNumber}
                    className={styles.addButton}
                    disabled={!config.smsNotifications.enabled}
                  >
                    Add
                  </button>
                </div>

                <div className={styles.phoneTags}>
                  {config.smsNotifications.phoneNumbers.map((phone, index) => (
                    <div key={index} className={styles.phoneTag}>
                      <span>{phone}</span>
                      <button
                        onClick={() => removePhoneNumber(phone)}
                        className={styles.removeTag}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={testSMSNotification}
                className={styles.testButton}
                disabled={!config.smsNotifications.enabled || testingSMS || config.smsNotifications.phoneNumbers.length === 0}
              >
                {testingSMS ? 'Sending...' : 'Send Test SMS'}
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Slack Integration</h2>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  id="slackEnabled"
                  checked={config.slackIntegration.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    slackIntegration: { ...config.slackIntegration, enabled: e.target.checked }
                  })}
                />
                <label htmlFor="slackEnabled" className={styles.switch}>
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>

            <div className={`${styles.sectionContent} ${!config.slackIntegration.enabled ? styles.disabled : ''}`}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Webhook URL</label>
                <input
                  type="url"
                  value={config.slackIntegration.webhookUrl}
                  onChange={(e) => setConfig({
                    ...config,
                    slackIntegration: { ...config.slackIntegration, webhookUrl: e.target.value }
                  })}
                  placeholder="https://hooks.slack.com/services/..."
                  className={styles.input}
                  disabled={!config.slackIntegration.enabled}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Channel</label>
                <input
                  type="text"
                  value={config.slackIntegration.channel}
                  onChange={(e) => setConfig({
                    ...config,
                    slackIntegration: { ...config.slackIntegration, channel: e.target.value }
                  })}
                  placeholder="#leads or @username"
                  className={styles.input}
                  disabled={!config.slackIntegration.enabled}
                />
              </div>

              <div className={styles.checkboxList}>
                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="newLeadSlack"
                    checked={config.slackIntegration.newLead}
                    onChange={(e) => setConfig({
                      ...config,
                      slackIntegration: { ...config.slackIntegration, newLead: e.target.checked }
                    })}
                    disabled={!config.slackIntegration.enabled}
                  />
                  <label htmlFor="newLeadSlack">New lead captured</label>
                </div>

                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="leadUpdateSlack"
                    checked={config.slackIntegration.leadUpdate}
                    onChange={(e) => setConfig({
                      ...config,
                      slackIntegration: { ...config.slackIntegration, leadUpdate: e.target.checked }
                    })}
                    disabled={!config.slackIntegration.enabled}
                  />
                  <label htmlFor="leadUpdateSlack">Lead information updated</label>
                </div>
              </div>

              <button
                onClick={testSlackIntegration}
                className={styles.testButton}
                disabled={!config.slackIntegration.enabled || testingSlack || !config.slackIntegration.webhookUrl}
              >
                {testingSlack ? 'Sending...' : 'Send Test Message'}
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Webhook Integration</h2>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  id="webhookEnabled"
                  checked={config.webhookIntegration.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    webhookIntegration: { ...config.webhookIntegration, enabled: e.target.checked }
                  })}
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
                  onChange={(e) => setConfig({
                    ...config,
                    webhookIntegration: { ...config.webhookIntegration, url: e.target.value }
                  })}
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
                  onChange={(e) => setConfig({
                    ...config,
                    webhookIntegration: { ...config.webhookIntegration, secret: e.target.value }
                  })}
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
                      checked={