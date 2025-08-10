import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../../components/layout';
import { useSupabase } from '../../hooks/useSupabase';
import { dbHelpers, KnowledgeBaseEntry } from '../../lib/supabaseClient';
import { getTenantId } from '../../utils/tenant'; // Import the new centralized helper

const KnowledgeBaseIndexPage: React.FC = () => {
  const { user } = useSupabase();
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null); // State for delete confirmation modal

  // Use the centralized helper
  const tenantId = getTenantId(user);

  const load = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setError(null);
      // Remove 'as any' cast for type safety
      const list = await dbHelpers.getKnowledgeBase(tenantId);
      setEntries(list ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const onDelete = async (id: string) => {
    if (!tenantId) return;
    try {
      // Remove 'as any' cast for type safety
      await dbHelpers.deleteKnowledgeBaseEntry(tenantId, id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setShowDeleteModal(null); // Close modal on success
    } catch (err: any) {
      // Replace alert with a more robust message display
      setError(err?.message ?? 'Delete failed');
      setShowDeleteModal(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const hay = [
        e.title,
        e.content,
        e.type,
        e.url ?? '',
        (e.tags ?? []).join(' ')
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, query]);

  return (
    <Layout title="Knowledge Base">
      <Head>
        <title>Knowledge Base - LeadSpark Portal</title>
      </Head>

      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Knowledge Base</h1>
            <p className="text-sm text-gray-500">Manage documents, URLs, and snippets your AI can use.</p>
          </div>
          <Link
            href="/knowledge-base/upload"
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
          >
            + Add Entry
          </Link>
        </div>

        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, content, tags, or URL…"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border px-4 py-8 text-center text-gray-500">
            No entries yet. Click “Add Entry” to create one.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((e) => (
              <li key={e.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{e.title}</h3>
                      <span className="rounded-full border px-2 py-0.5 text-xs uppercase text-gray-600">
                        {e.type}
                      </span>
                    </div>

                    {e.url && (
                      <div className="mt-1">
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 underline"
                        >
                          {e.url}
                        </a>
                      </div>
                    )}

                    <p className="mt-2 text-sm text-gray-700">
                      {e.content.length > 240 ? `${e.content.slice(0, 240)}…` : e.content}
                    </p>

                    {e.tags && e.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {e.tags.map((t) => (
                          <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-400">
                      Added {new Date(e.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setShowDeleteModal(e.id)} // Open modal instead of confirm
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Custom delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this entry? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(showDeleteModal)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default KnowledgeBaseIndexPage;
