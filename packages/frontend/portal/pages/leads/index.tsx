import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import LeadCard from '../../components/LeadCard';
import useSupabase from '../../hooks/useSupabase';
import { dbHelpers, Lead } from '../../lib/supabaseClient';
import styles from './index.module.scss';

type FilterStatus = 'all' | 'new' | 'contacted' | 'qualified' | 'converted';
type SortOption = 'created_desc' | 'created_asc' | 'name_asc' | 'name_desc';

const LeadsPage: React.FC = () => {
  const { getTenantId, loading } = useSupabase();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');

  const tenantId = getTenantId();

  useEffect(() => {
    if (!tenantId || loading) return;

    const fetchLeads = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const leadsData = await dbHelpers.getLeads(tenantId);
        setLeads(leadsData);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Failed to load leads');
      } finally {
        setLoadingData(false);
      }
    };

    fetchLeads();
  }, [tenantId, loading]);

  useEffect(() => {
    let filtered = [...leads];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.first_name.toLowerCase().includes(search) ||
        lead.last_name.toLowerCase().includes(search) ||
        lead.email.toLowerCase().includes(search) ||
        (lead.phone && lead.phone.includes(search))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'name_desc':
          return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`);
        default:
          return 0;
      }
    });

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter, sortBy]);

  const handleExportLeads = () => {
    const csvData = filteredLeads.map(lead => ({
      'First Name': lead.first_name,
      'Last Name': lead.last_name,
      'Email': lead.email,
      'Phone': lead.phone || '',
      'Investment Goals': lead.investment_goals || '',
      'Source': lead.source || '',
      'Status': lead.status,
      'Created At': new Date(lead.created_at).toLocaleString(),
      'Last Contacted': lead.last_contacted ? new Date(lead.last_contacted).toLocaleString() : ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusCounts = () => {
    return {
      all: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      converted: leads.filter(l => l.status === 'converted').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loadingData) {
    return (
      <Layout title="Leads - LeadSpark Portal">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading leads...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Leads - LeadSpark Portal">
      <Head>
        <title>Leads - LeadSpark Portal</title>
        <meta name="description" content="Manage and view all your captured leads" />
      </Head>

      <div className={styles.leadsContainer}>
        {/* Header */}
        <header className={styles.leadsHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Your Leads</h1>
            <p className={styles.leadsCount}>
              {filteredLeads.length} of {leads.length} leads
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={handleExportLeads}
              className={styles.exportButton}
              disabled={filteredLeads.length === 0}
            >
              📊 Export CSV
            </button>
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
                placeholder="Search leads by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.filterControls}>
            <div className={styles.statusFilters}>
              {(Object.keys(statusCounts) as FilterStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`${styles.filterButton} ${statusFilter === status ? styles.active : ''}`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className={styles.filterCount}>
                    {statusCounts[status]}
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.sortContainer}>
              <label htmlFor="sortSelect" className={styles.sortLabel}>Sort by:</label>
              <select
                id="sortSelect"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={styles.sortSelect}
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Grid */}
        {filteredLeads.length === 0 ? (
          <div className={styles.emptyState}>
            {leads.length === 0 ? (
              <>
                <div className={styles.emptyIcon}>👥</div>
                <h2 className={styles.emptyTitle}>No leads yet</h2>
                <p className={styles.emptyText}>
                  Your AI assistant is ready to capture leads from your website.
                  Make sure your widget is properly installed and configured.
                </p>
              </>
            ) : (
              <>
                <div className={styles.emptyIcon}>🔍</div>
                <h2 className={styles.emptyTitle}>No matching leads</h2>
                <p className={styles.emptyText}>
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className={styles.clearFiltersButton}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={styles.leadsGrid}>
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LeadsPage;