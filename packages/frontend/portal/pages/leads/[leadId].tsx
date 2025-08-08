import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout';
import { useSupabase } from '../../hooks/useSupabase';
import { dbHelpers, Lead, Conversation } from '../../lib/supabaseClient';
import styles from './[leadId].module.scss';

const LeadDetailPage: React.FC = () => {
  const router = useRouter();
  const { leadId } = router.query;
  const { getTenantId, loading } = useSupabase();
  const [lead, setLead] = useState<Lead | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const tenantId = getTenantId();

  useEffect(() => {
    if (!tenantId || !leadId || loading) return;

    const fetchLeadData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        // Fetch lead details
        const leadData = await dbHelpers.getLead(leadId as string, tenantId);
        setLead(leadData);
        setNotes(leadData.notes || '');

        // Fetch conversations for this lead
        const conversationData = await dbHelpers.getConversationsForLead(leadId as string, tenantId);
        setConversations(conversationData);
      } catch (err) {
        console.error('Error fetching lead data:', err);
        setError('Failed to load lead details');
      } finally {
        setLoadingData(false);
      }
    };

    fetchLeadData();
  }, [tenantId, leadId, loading]);

  const updateLeadStatus = async (newStatus: Lead['status']) => {
    if (!lead || !tenantId) return;

    try {
      setUpdatingStatus(true);
      const updatedLead = await dbHelpers.updateLeadStatus(lead.id, newStatus, tenantId);
      setLead(updatedLead);
    } catch (err) {
      console.error('Error updating lead status:', err);
      setError('Failed to update lead status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveNotes = async () => {
    if (!lead || !tenantId) return;

    try {
      setSavingNotes(true);
      // This would need to be implemented in dbHelpers
      // await dbHelpers.updateLeadNotes(lead.id, notes, tenantId);

      // For now, simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLead({ ...lead, notes });
    } catch (err) {
      console.error('Error saving notes:', err);
      setError('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new':
        return styles.statusNew;
      case 'contacted':
        return styles.statusContacted;
      case 'qualified':
        return styles.statusQualified;
      case 'converted':
        return styles.statusConverted;
      default:
        return styles.statusNew;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTranscript = (transcript: any) => {
    if (!transcript) return [];

    // Handle different transcript formats
    if (Array.isArray(transcript)) {
      return transcript;
    }

    if (typeof transcript === 'object' && transcript.messages) {
      return transcript.messages;
    }

    return [];
  };

  if (loadingData) {
    return (
      <Layout title="Loading Lead - LeadSpark Portal">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading lead details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !lead) {
    return (
      <Layout title="Lead Not Found - LeadSpark Portal">
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h1 className={styles.errorTitle}>Lead Not Found</h1>
          <p className={styles.errorText}>
            {error || 'The requested lead could not be found.'}
          </p>
          <Link href="/leads" className={styles.backButton}>
            Back to Leads
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${lead.first_name} ${lead.last_name} - LeadSpark Portal`}>
      <Head>
        <title>{lead.first_name} {lead.last_name} - LeadSpark Portal</title>
        <meta name="description" content={`Lead details for ${lead.first_name} ${lead.last_name}`} />
      </Head>

      <div className={styles.leadDetailContainer}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/leads" className={styles.breadcrumbLink}>
            Leads
          </Link>
          <span className={styles.breadcrumbSeparator}>→</span>
          <span className={styles.breadcrumbCurrent}>
            {lead.first_name} {lead.last_name}
          </span>
        </nav>

        {/* Lead Header */}
        <header className={styles.leadHeader}>
          <div className={styles.leadInfo}>
            <div className={styles.leadAvatar}>
              {lead.first_name.charAt(0)}{lead.last_name.charAt(0)}
            </div>
            <div className={styles.leadDetails}>
              <h1 className={styles.leadName}>
                {lead.first_name} {lead.last_name}
              </h1>
              <p className={styles.leadEmail}>{lead.email}</p>
              {lead.phone && (
                <p className={styles.leadPhone}>
                  <span className={styles.phoneIcon}>📞</span>
                  {lead.phone}
                </p>
              )}
            </div>
          </div>

          <div className={styles.leadActions}>
            <div className={`${styles.statusBadge} ${getStatusColor(lead.status)}`}>
              {lead.status}
            </div>
          </div>
        </header>

        <div className={styles.contentGrid}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* Lead Information */}
            <section className={styles.infoSection}>
              <h2 className={styles.sectionTitle}>Lead Information</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Created</label>
                  <span className={styles.infoValue}>
                    {formatDate(lead.created_at)}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Source</label>
                  <span className={styles.infoValue}>
                    {lead.source || 'Unknown'}
                  </span>
                </div>

                {lead.last_contacted && (
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Last Contacted</label>
                    <span className={styles.infoValue}>
                      {formatDate(lead.last_contacted)}
                    </span>
                  </div>
                )}

                {lead.investment_goals && (
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>Investment Goals</label>
                    <span className={styles.infoValue}>
                      {lead.investment_goals}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Status Management */}
            <section className={styles.statusSection}>
              <h2 className={styles.sectionTitle}>Update Status</h2>
              <div className={styles.statusButtons}>
                {(['new', 'contacted', 'qualified', 'converted'] as Lead['status'][]).map(status => (
                  <button
                    key={status}
                    onClick={() => updateLeadStatus(status)}
                    disabled={lead.status === status || updatingStatus}
                    className={`${styles.statusButton} ${
                      lead.status === status ? styles.currentStatus : ''
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </section>

            {/* Notes */}
            <section className={styles.notesSection}>
              <h2 className={styles.sectionTitle}>Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this lead..."
                className={styles.notesTextarea}
                rows={6}
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes || notes === (lead.notes || '')}
                className={styles.saveNotesButton}
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </section>
          </div>

          {/* Right Column - Conversations */}
          <div className={styles.rightColumn}>
            <section className={styles.conversationsSection}>
              <h2 className={styles.sectionTitle}>
                Conversations ({conversations.length})
              </h2>

              {conversations.length === 0 ? (
                <div className={styles.noConversations}>
                  <div className={styles.noConversationsIcon}>💬</div>
                  <p className={styles.noConversationsText}>
                    No conversations recorded yet.
                  </p>
                </div>
              ) : (
                <div className={styles.conversationsList}>
                  {conversations.map((conversation) => {
                    const messages = formatTranscript(conversation.transcript_json);

                    return (
                      <div key={conversation.id} className={styles.conversationCard}>
                        <div className={styles.conversationHeader}>
                          <span className={styles.conversationDate}>
                            {formatDate(conversation.created_at)}
                          </span>
                          {conversation.duration_seconds && (
                            <span className={styles.conversationDuration}>
                              {Math.round(conversation.duration_seconds / 60)}m
                            </span>
                          )}
                        </div>

                        <div className={styles.conversationContent}>
                          {messages.length > 0 ? (
                            <div className={styles.messagesList}>
                              {messages.slice(0, 3).map((message: any, index: number) => (
                                <div key={index} className={styles.message}>
                                  <div className={styles.messageHeader}>
                                    <span className={`${styles.messageSender} ${
                                      message.role === 'assistant' ? styles.ai : styles.user
                                    }`}>
                                      {message.role === 'assistant' ? '🤖 AI' : '👤 User'}
                                    </span>
                                  </div>
                                  <div className={styles.messageText}>
                                    {message.content}
                                  </div>
                                </div>
                              ))}
                              {messages.length > 3 && (
                                <p className={styles.moreMessages}>
                                  +{messages.length - 3} more messages
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className={styles.noTranscript}>
                              Transcript not available
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetailPage;