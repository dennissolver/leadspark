import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout';
import { useSupabase } from '../../hooks/useSupabase';
import { dbHelpers, KnowledgeBaseEntry } from '../../lib/supabaseClient';
import styles from './index.module.scss';

type FilterType = 'all' | 'document' | 'url' | 'text';

const KnowledgeBasePage: React.FC = () => {
  const { getTenantId, loading } = useSupabase();
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);

  const tenantId = getTenantId();

  useEffect(() => {
    if (!tenantId || loading) return;

    const fetchKnowledgeBase = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const kbData = await dbHelpers.getKnowledgeBase(tenantId);
        setEntries(kbData);
      } catch (err) {
        console.error('Error fetching knowledge base:', err);
        setError('Failed to load knowledge base');
      } finally {
        setLoadingData(false);
      }
    };

    fetchKnowledgeBase();
  }, [tenantId, loading]);

  useEffect(() => {
    let filtered = [...entries];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(search) ||
        entry.content.toLowerCase().includes(search) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(search)))
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(entry => entry.type === typeFilter);
    }

    // Sort by most recent
    filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredEntries(filtered);
  }, [entries, searchTerm, typeFilter]);

  const deleteEntry = async (entryId: string) => {
    if (!tenantId || !confirm('Are you sure you want to delete this entry?')) return;

    try {
      setDeletingEntry(entryId);
      // This would need to be implemented in dbHelpers
      // await dbHelpers.deleteKnowledgeBaseEntry(entryId, tenantId);

      // For now, simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEntries(entries.filter(entry => entry.id !== entryId));
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry');
    } finally {
      setDeletingEntry(null);
    }
  };

  const getTypeIcon = (type: KnowledgeBaseEntry['type']) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'url':
        return '🌐';
      case 'text':
        return '📝';
      default:
        return '📚';
    }
  };

  const getTypeCounts = () => {
    return {
      all: entries.length,
      document: entries.filter(e => e.type === 'document').length,
      url: entries.filter(e => e.type === 'url').length,
      text: entries.filter(e => e.type === 'text').length,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, maxLength) + '...';
  };

  const typeCounts = getTypeCounts();

  if (loadingData) {
    return (
      <Layout title="Knowledge Base - LeadSpark Portal">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading knowledge base...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Knowledge Base - LeadSpark Portal">
      <Head>
        <title>Knowledge Base - LeadSpark Portal</title>
        <meta name="description" content="Manage your AI assistant's knowledge base content" />
      </Head>

      <div className={styles.knowledgeBaseContainer}>
        {/* Header */}
        <header className={styles.kbHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Knowledge Base</h1>
            <p className={styles.kbCount}>
              {filteredEntries.length} of {entries.length} entries
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/knowledge-base/upload" className={styles.uploadButton}>
              ➕ Add Content
            </Link>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className={styles.filtersSection}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search knowledge base entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.typeFilters}>
            {(Object.keys(typeCounts) as FilterType[]).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`${styles.filterButton} ${typeFilter === type ? styles.active : ''}`}
              >
                {type === 'all' ? '📚' : getTypeIcon(type as Exclude<FilterType, 'all'>)}
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                <span className={styles.filterCount}>
                  {typeCounts[type]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {filteredEntries.length === 0 ? (
          <div className={styles.emptyState}>
            {entries.length === 0 ? (
              <>
                <div className={styles.emptyIcon}>📚</div>
                <h2 className={styles.emptyTitle}>No knowledge base entries</h2>
                <p className={styles.emptyText}>
                  Start building your AI's knowledge by adding documents, URLs, or text content.
                  This will help your assistant provide more accurate and helpful responses.
                </p>
                <Link href="/knowledge-base/upload" className={styles.getStartedButton}>
                  Add Your First Entry
                </Link>
              </>
            ) : (
              <>
                <div className={styles.emptyIcon}>🔍</div>
                <h2 className={styles.emptyTitle}>No matching entries</h2>
                <p className={styles.emptyText}>
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                  }}
                  className={styles.clearFiltersButton}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={styles.entriesGrid}>
            {filteredEntries.map((entry) => (
              <div key={entry.id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <div className={styles.entryType}>
                    <span className={styles.typeIcon}>
                      {getTypeIcon(entry.type)}
                    </span>
                    <span className={styles.typeName}>
                      {entry.type}
                    </span>
                  </div>

                  <div className={styles.entryActions}>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      disabled={deletingEntry === entry.id}
                      className={styles.deleteButton}
                      title="Delete entry"
                    >
                      {deletingEntry === entry.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>

                <div className={styles.entryContent}>
                  <h3 className={styles.entryTitle}>{entry.title}</h3>

                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.entryUrl}
                    >
                      {entry.url}
                    </a>
                  )}

                  <p className={styles.entryDescription}>
                    {truncateContent(entry.content)}
                  </p>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className={styles.entryTags}>
                      {entry.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className={styles.tagMore}>
                          +{entry.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.entryFooter}>
                  <span className={styles.entryDate}>
                    Added {formatDate(entry.created_at)}
                  </span>

                  <div className={styles.entryStats}>
                    <span className={styles.contentLength}>
                      {entry.content.length} chars
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KnowledgeBasePage;