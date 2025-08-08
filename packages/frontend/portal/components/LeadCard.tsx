import React from 'react';
import { useRouter } from 'next/router';
import styles from './LeadCard.module.scss';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  investment_goals?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  created_at: string;
  last_contacted?: string;
}

interface LeadCardProps {
  lead: Lead;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/leads/${lead.id}`);
  };

  const getStatusColor = (status: string) => {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className={styles.leadCard} onClick={handleCardClick}>
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>
          {getInitials(lead.first_name, lead.last_name)}
        </div>
        <div className={styles.leadInfo}>
          <h3 className={styles.leadName}>
            {lead.first_name} {lead.last_name}
          </h3>
          <p className={styles.leadEmail}>{lead.email}</p>
        </div>
        <div className={`${styles.statusBadge} ${getStatusColor(lead.status)}`}>
          {lead.status}
        </div>
      </div>

      <div className={styles.cardBody}>
        {lead.phone && (
          <div className={styles.contactInfo}>
            <span className={styles.label}>Phone:</span>
            <span className={styles.value}>{lead.phone}</span>
          </div>
        )}

        {lead.investment_goals && (
          <div className={styles.investmentGoals}>
            <span className={styles.label}>Goals:</span>
            <span className={styles.value}>{lead.investment_goals}</span>
          </div>
        )}

        {lead.source && (
          <div className={styles.sourceInfo}>
            <span className={styles.label}>Source:</span>
            <span className={styles.value}>{lead.source}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.dateInfo}>
          <span className={styles.createdDate}>
            Created: {formatDate(lead.created_at)}
          </span>
          {lead.last_contacted && (
            <span className={styles.contactedDate}>
              Last contacted: {formatDate(lead.last_contacted)}
            </span>
          )}
        </div>
        <div className={styles.cardActions}>
          <button
            className={styles.viewButton}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/leads/${lead.id}`);
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;