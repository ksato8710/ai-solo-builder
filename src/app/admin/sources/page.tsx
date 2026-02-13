'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

interface ContentSource {
  id: string;
  name: string;
  url: string;
  category: string;
  quality_rating: number;
  accessibility_rating: number;
  is_free: boolean;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'tech-community',
  'dev-tools', 
  'indie-business',
  'startup',
  'dev-knowledge',
  'tech-analysis',
  'consumer-tech',
  'business-innovation',
  'tech-research',
  'tech-culture'
];

export default function SourcesAdminPage() {
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ category: '', active: '' });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContentSource>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<ContentSource>>({
    quality_rating: 3,
    accessibility_rating: 3,
    is_free: true,
    is_active: false
  });

  useEffect(() => {
    fetchSources();
  }, [filter]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.set('category', filter.category);
      if (filter.active) params.set('active', filter.active);

      const response = await fetch(`/api/admin/sources?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sources');
      }

      setSources(data.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const initializeSources = async () => {
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize sources');
      }

      alert(`Successfully initialized ${data.sources.length} sources!`);
      fetchSources();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateSource = async (id: string, updates: Partial<ContentSource>) => {
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update source');
      }

      fetchSources();
      setIsEditing(null);
      setEditForm({});
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const addSource = async () => {
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add source');
      }

      fetchSources();
      setIsAdding(false);
      setNewForm({
        quality_rating: 3,
        accessibility_rating: 3,
        is_free: true,
        is_active: false
      });
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const deleteSource = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/sources?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete source');
      }

      fetchSources();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const startEdit = (source: ContentSource) => {
    setIsEditing(source.id);
    setEditForm(source);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
  };

  const RatingStars = ({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className={`text-xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ⭐
        </button>
      ))}
    </div>
  );

  if (loading) return <div className="p-8 text-slate-300">Loading...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-100">情報源管理</h1>

      {/* コントロール */}
      <div className="mb-6 flex flex-wrap gap-4 items-center p-4 bg-slate-800/50 rounded-lg border border-slate-600">
        <select
          value={filter.category}
          onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
          className="border border-slate-600 bg-slate-700 text-slate-200 rounded px-3 py-2 focus:border-blue-400 focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filter.active}
          onChange={(e) => setFilter(prev => ({ ...prev, active: e.target.value }))}
          className="border border-slate-600 bg-slate-700 text-slate-200 rounded px-3 py-2 focus:border-blue-400 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition-colors font-medium"
        >
          ➕ 新規追加
        </button>

        {sources.length === 0 && (
          <button
            onClick={initializeSources}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-500 transition-colors font-medium"
          >
            🚀 初期データ投入
          </button>
        )}

        <div className="text-sm text-slate-400 bg-slate-700/50 px-3 py-1 rounded">
          Total: {sources.length} sources
        </div>
      </div>

      {/* 新規追加フォーム */}
      {isAdding && (
        <div className="mb-6 p-6 border border-slate-600 rounded-lg bg-slate-800/60 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
            ➕ 新規情報源追加
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={newForm.name || ''}
              onChange={(e) => setNewForm(prev => ({ ...prev, name: e.target.value }))}
              className="border border-slate-600 bg-slate-700 text-slate-200 placeholder-slate-400 rounded px-3 py-2 focus:border-blue-400 focus:outline-none"
            />
            <input
              type="url"
              placeholder="URL"
              value={newForm.url || ''}
              onChange={(e) => setNewForm(prev => ({ ...prev, url: e.target.value }))}
              className="border border-slate-600 bg-slate-700 text-slate-200 placeholder-slate-400 rounded px-3 py-2 focus:border-blue-400 focus:outline-none"
            />
            <select
              value={newForm.category || ''}
              onChange={(e) => setNewForm(prev => ({ ...prev, category: e.target.value }))}
              className="border border-slate-600 bg-slate-700 text-slate-200 rounded px-3 py-2 focus:border-blue-400 focus:outline-none"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <textarea
              placeholder="Description"
              value={newForm.description || ''}
              onChange={(e) => setNewForm(prev => ({ ...prev, description: e.target.value }))}
              className="border border-slate-600 bg-slate-700 text-slate-200 placeholder-slate-400 rounded px-3 py-2 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div className="mt-4 flex gap-4 items-center">
            <label className="flex items-center gap-2">
              Quality Rating:
              <RatingStars 
                rating={newForm.quality_rating || 3}
                onChange={(rating) => setNewForm(prev => ({ ...prev, quality_rating: rating }))}
              />
            </label>
            <label className="flex items-center gap-2">
              Accessibility:
              <RatingStars 
                rating={newForm.accessibility_rating || 3}
                onChange={(rating) => setNewForm(prev => ({ ...prev, accessibility_rating: rating }))}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newForm.is_free}
                onChange={(e) => setNewForm(prev => ({ ...prev, is_free: e.target.checked }))}
              />
              Free
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newForm.is_active}
                onChange={(e) => setNewForm(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={addSource}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              追加
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 情報源一覧 */}
      <div className="space-y-4">
        {sources.map(source => (
          <div key={source.id} className="border border-slate-600 rounded-lg p-4 bg-slate-800/40 backdrop-blur-sm hover:bg-slate-800/60 transition-all">
            {isEditing === source.id ? (
              // 編集モード
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="border rounded px-3 py-2"
                  />
                  <input
                    type="url"
                    value={editForm.url || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                    className="border rounded px-3 py-2"
                  />
                  <select
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="border rounded px-3 py-2"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="border rounded px-3 py-2"
                  />
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2">
                    Quality:
                    <RatingStars 
                      rating={editForm.quality_rating || 3}
                      onChange={(rating) => setEditForm(prev => ({ ...prev, quality_rating: rating }))}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    Accessibility:
                    <RatingStars 
                      rating={editForm.accessibility_rating || 3}
                      onChange={(rating) => setEditForm(prev => ({ ...prev, accessibility_rating: rating }))}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_free}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_free: e.target.checked }))}
                    />
                    Free
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSource(source.id, editForm)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              // 表示モード
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-slate-200">{source.name}</h3>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-sm rounded border border-blue-400/30">
                      {source.category}
                    </span>
                    <span className={`px-2 py-1 text-sm rounded border ${source.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                      {source.is_active ? '✅ Active' : '⭕ Inactive'}
                    </span>
                    {source.is_free && (
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-sm rounded border border-amber-400/30">
                        💰 Free
                      </span>
                    )}
                  </div>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                    {source.url}
                  </a>
                  {source.description && (
                    <p className="text-slate-400 mt-2">{source.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-slate-300">
                    <span>Quality: {source.quality_rating}/5 ⭐</span>
                    <span>Accessibility: {source.accessibility_rating}/5 ⭐</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(source)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteSource(source.id, source.name)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sources.length === 0 && (
          <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-600/50">
            <div className="text-slate-400 mb-4 text-lg">📄</div>
            <p className="text-slate-400 mb-2">No sources found.</p>
            <p className="text-slate-500 text-sm">Click "🚀 初期データ投入" to add initial sources.</p>
          </div>
        )}
      </div>
    </div>
  );
}