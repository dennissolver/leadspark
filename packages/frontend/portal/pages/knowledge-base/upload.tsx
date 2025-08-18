import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Added the missing import for the Link component
import Layout from '../../components/layout';
import { useSupabase } from '@leadspark/common/src/utils/supabase/useSupabase'; // Corrected import path
import { Lead } from '@leadspark/common/src/utils/supabase/supabaseClient'; // Assuming 'Lead' type is still in this file
import { getTenantId } from '@leadspark/common/src/utils/supabase/tenantUtils';

type NewEntry = Omit<KnowledgeBaseEntry, 'id' | 'created_at' | 'updated_at'>;

const UploadKnowledgeBasePage: React.FC = () => {
  const { user } = useSupabase();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<KnowledgeBaseEntry['type']>('text');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantId = getTenantId(user);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError('No tenant found for current user.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (type !== 'url' && !content.trim()) {
      setError('Content is required for non-URL entries.');
      return;
    }
    if (type === 'url' && !url.trim()) {
      setError('URL is required for URL entries.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const entry: NewEntry = {
        tenant_id: tenantId,
        title: title.trim(),
        content: content.trim(),
        type,
        url: url.trim() || undefined,
        file_path: undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      await dbHelpers.createKnowledgeBaseEntry(entry);
      router.push('/knowledge-base');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Add Knowledge Base Entry">
      <Head>
        <title>Add Knowledge Base Entry - LeadSpark Portal</title>
      </Head>

      <div className="container mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Add Knowledge Base Entry</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as KnowledgeBaseEntry['type'])}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              >
                <option value="text">Text</option>
                <option value="document">Document</option>
                <option value="url">URL</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">URL (for type “URL”)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={type === 'url' ? 'Optional: summary or notes for this URL' : 'Paste or write the content here'}
              rows={8}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="pricing, onboarding, refund-policy"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
            <Link href="/knowledge-base" className="rounded-lg border px-4 py-2 hover:bg-gray-50">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default UploadKnowledgeBasePage;
