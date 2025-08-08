import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import { useSupabase } from '../../hooks/useSupabase';
import { dbHelpers } from '../../lib/supabaseClient';
import styles from './upload.module.scss';

type UploadType = 'document' | 'url' | 'text';

interface UploadData {
  title: string;
  content: string;
  type: UploadType;
  url?: string;
  tags: string[];
}

const UploadPage: React.FC = () => {
  const router = useRouter();
  const { getTenantId } = useSupabase();
  const [activeTab, setActiveTab] = useState<UploadType>('text');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const tenantId = getTenantId();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Auto-generate title from filename if not set
    if (!title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }

    // Read file content for text files
    if (selectedFile.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUrlFetch = async () => {
    if (!url) return;

    try {
      setUploading(true);
      setError(null);

      // In a real implementation, you'd call your backend to scrape the URL
      // For now, we'll simulate this
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate extracted content
      const simulatedContent = `Content extracted from: ${url}\n\nThis would contain the actual webpage content...`;
      setContent(simulatedContent);

      // Auto-generate title if not set
      if (!title) {
        try {
          const urlObj = new URL(url);
          setTitle(`Content from ${urlObj.hostname}`);
        } catch {
          setTitle('Web Content');
        }
      }
    } catch (err) {
      setError('Failed to fetch content from URL');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantId) {
      setError('Authentication required');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const uploadData: Omit<UploadData, 'tags'> & { tags: string[] } = {
        title: title.trim(),
        content: content.trim(),
        type: activeTab,
        tags: tagsArray,
        ...(activeTab === 'url' && url ? { url: url.trim() } : {})
      };

      // Create the knowledge base entry
      await dbHelpers.createKnowledgeBaseEntry({
        ...uploadData,
        tenant_id: tenantId
      });

      setSuccess('Content added successfully!');

      // Reset form
      setTitle('');
      setContent('');
      setUrl('');
      setTags('');
      setFile(null);

      // Redirect after success
      setTimeout(() => {
        router.push('/knowledge-base');
      }, 2000);

    } catch (err) {
      console.error('Error creating knowledge base entry:', err);
      setError('Failed to add content. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'document':
        return (
          <div className={styles.documentUpload}>
            <div className={styles.fileUploadArea}>
              <input
                type="file"
                id="fileInput"
                accept=".txt,.pdf,.doc,.docx,.md"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              <label htmlFor="fileInput" className={styles.fileInputLabel}>
                <div className={styles.uploadIcon}>📄</div>
                <div className={styles.uploadText}>
                  <strong>Click to upload a document</strong>
                  <span>PDF, DOC, TXT, MD files up to 10MB</span>
                </div>
              </label>
            </div>

            {file && (
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>📄 {file.name}</span>
                <span className={styles.fileSize}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>
        );

      case 'url':
        return (
          <div className={styles.urlUpload}>
            <div className={styles.urlInputGroup}>
              <input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={styles.urlInput}
              />
              <button
                type="button"
                onClick={handleUrlFetch}
                disabled={!url || uploading}
                className={styles.fetchButton}
              >
                {uploading ? '⏳' : '🌐'} Fetch
              </button>
            </div>
            <p className={styles.urlHelpText}>
              Enter a URL to automatically extract and import its content.
            </p>
          </div>
        );

      case 'text':
        return (
          <div className={styles.textUpload}>
            <p className={styles.textHelpText}>
              Paste or type your content directly.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout title="Add Content - LeadSpark Portal">
      <Head>
        <title>Add Content - LeadSpark Portal</title>
        <meta name="description" content="Add new content to your AI assistant's knowledge base" />
      </Head>

      <div className={styles.uploadContainer}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/knowledge-base" className={styles.breadcrumbLink}>
            Knowledge Base
          </Link>
          <span className={styles.breadcrumbSeparator}>→</span>
          <span className={styles.breadcrumbCurrent}>Add Content</span>
        </nav>

        {/* Header */}
        <header className={styles.uploadHeader}>
          <h1 className={styles.pageTitle}>Add Knowledge Base Content</h1>
          <p className={styles.pageDescription}>
            Add documents, web content, or text to help your AI assistant provide better responses.
          </p>
        </header>

        {/* Messages */}
        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.messageIcon}>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <span className={styles.messageIcon}>✅</span>
            {success}
          </div>
        )}

        {/* Upload Form */}
        <div className={styles.uploadForm}>
          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`${styles.tabButton} ${activeTab === 'text' ? styles.active : ''}`}
            >
              📝 Text Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={`${styles.tabButton} ${activeTab === 'document' ? styles.active : ''}`}
            >
              📄 Upload Document
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`${styles.tabButton} ${activeTab === 'url' ? styles.active : ''}`}
            >
              🌐 Import from URL
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>

          {/* Common Form Fields */}
          <form onSubmit={handleSubmit} className={styles.contentForm}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.formLabel}>
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content" className={styles.formLabel}>
                Content *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter or paste your content here..."
                className={styles.contentTextarea}
                rows={10}
                required
              />
              <div className={styles.characterCount}>
                {content.length} characters
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags" className={styles.formLabel}>
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., pricing, features, support (separate with commas)"
                className={styles.formInput}
              />
              <div className={styles.fieldHelp}>
                Add tags to help organize and search your content.
              </div>
            </div>

            {/* Form Actions */}
            <div className={styles.formActions}>
              <Link href="/knowledge-base" className={styles.cancelButton}>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={uploading || !title.trim() || !content.trim()}
                className={styles.submitButton}
              >
                {uploading ? '⏳ Adding...' : '✅ Add Content'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default UploadPage;