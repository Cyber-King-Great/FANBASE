import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  BarChart3,
  Layers,
  Users,
  Music,
  FileText,
  DollarSign,
  Settings as SettingsIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Category, Candidate, Campaign, Article, AdSlot as AdSlotType } from '../types';
import {
  fetchAdminAnalytics,
  fetchCategories,
  fetchCurrentCampaign,
  fetchArticles,
  fetchAdSlots
} from '../lib/api';

interface AdminViewProps {
  onDataChanged: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onDataChanged }) => {
  const [adminEmail, setAdminEmail] = useState('cyberjoker391@gmail.com');
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'categories' | 'candidates' | 'campaign' | 'articles' | 'ads' | 'settings' | 'audit'
  >('analytics');

  const [analytics, setAnalytics] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<AdSlotType[]>([]);
  const [settings, setSettings] = useState<any>({ disclaimerText: '', allowAnonymousVoting: true });
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form states
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Partial<Candidate> | null>(null);
  const [selectedCandidateCategoryId, setSelectedCandidateCategoryId] = useState<string>('');
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resAnalytics, resCats, resCands, resCamp, resArts, resAds, resSettings] =
        await Promise.all([
          fetchAdminAnalytics(adminEmail),
          fetchCategories(),
          fetch('/api/admin/candidates', { headers: { 'x-admin-email': adminEmail } }).then((r) => r.json()).catch(() => []),
          fetchCurrentCampaign(),
          fetchArticles(),
          fetchAdSlots(),
          fetch('/api/settings').then((r) => r.json()).catch(() => ({}))
        ]);

      setAnalytics(resAnalytics);
      setCategories(resCats || []);
      setCandidates(resCands || []);
      setCampaign(resCamp);
      setArticles(resArts || []);
      setAds(resAds || []);
      setSettings(resSettings || {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [adminEmail]);

  // Category save
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify(editingCategory)
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Category saved successfully in Firestore.');
        setEditingCategory(null);
        fetchAdminData();
        onDataChanged();
      }
    } finally {
      setLoading(false);
    }
  };

  // Candidate save
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate?.title) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify({
          candidate: editingCandidate,
          categoryId: selectedCandidateCategoryId
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Candidate saved successfully.');
        setEditingCandidate(null);
        fetchAdminData();
        onDataChanged();
      }
    } finally {
      setLoading(false);
    }
  };

  // Campaign phase & config update
  const handleUpdateCampaign = async (newPhase: string) => {
    if (!campaign) return;
    setLoading(true);
    try {
      const updated = { ...campaign, currentPhase: newPhase };
      const res = await fetch('/api/admin/campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        setCampaign(updated);
        setActionMessage(`Campaign phase updated to ${newPhase}.`);
        onDataChanged();
      }
    } finally {
      setLoading(false);
    }
  };

  // Article save
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle?.title) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify(editingArticle)
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Article saved to Firestore.');
        setEditingArticle(null);
        fetchAdminData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Ad slot toggle
  const handleToggleAd = async (ad: AdSlotType) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify({ ...ad, enabled: !ad.enabled })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Ad slot '${ad.placement}' updated.`);
        fetchAdminData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Settings update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Platform settings updated in Firestore.');
        onDataChanged();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      {/* Admin Title & Auth Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Admin Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Fanbase Operations Control</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            Authenticated as: <span className="font-semibold text-amber-400">{adminEmail}</span>
          </div>
          <button
            onClick={fetchAdminData}
            title="Refresh database records"
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="my-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-neutral-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-3 my-2 border-b border-neutral-800">
        {[
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'campaign', label: 'Campaign Phase', icon: ShieldAlert },
          { id: 'categories', label: 'Categories', icon: Layers },
          { id: 'candidates', label: 'Candidates', icon: Music },
          { id: 'articles', label: 'Articles CMS', icon: FileText },
          { id: 'ads', label: 'Ad Placements', icon: DollarSign },
          { id: 'settings', label: 'Settings & Legal', icon: SettingsIcon },
          { id: 'audit', label: 'Audit Logs', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-400 text-neutral-950 font-bold'
                  : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Real-time Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
              <div className="text-xs text-neutral-400 font-medium">Total Fan Predictions</div>
              <div className="text-2xl font-black text-white mt-1">
                {analytics?.stats?.totalVotes ?? 0}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
              <div className="text-xs text-neutral-400 font-medium">Active Categories</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {analytics?.categoriesCount ?? categories.length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
              <div className="text-xs text-neutral-400 font-medium">Prediction Candidates</div>
              <div className="text-2xl font-black text-white mt-1">
                {analytics?.candidatesCount ?? candidates.length}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
              <div className="text-xs text-neutral-400 font-medium">Votes Today</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {analytics?.votesToday ?? 0}
              </div>
            </div>
          </div>

          {/* Recent Votes Log */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
            <h3 className="text-sm font-bold text-white mb-3">Live Vote Verification Stream</h3>
            {analytics?.recentVotes?.length ? (
              <div className="space-y-2">
                {analytics.recentVotes.map((v: any, idx: number) => (
                  <div
                    key={v.id || idx}
                    className="text-xs p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white">{v.candidateName}</span>
                      <span className="text-neutral-400"> in {v.categoryName}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {v.country} ({v.countryCode}) • {new Date(v.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 py-6 text-center">
                No recent votes. Realtime submissions will stream here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Campaign Phase Manager */}
      {activeTab === 'campaign' && (
        <div className="space-y-6 py-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <h3 className="text-base font-bold text-white mb-1">Campaign Phase Lifecycle</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Switch the awards phase. The platform UI adapts dynamically to current phase.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
              {[
                { id: 'NOMINATION_PREDICTION', title: '1. Nomination Prediction', desc: 'Fans predict who will be nominated' },
                { id: 'NOMINATION_VOTING', title: '2. Nomination Voting', desc: 'Final push before nominations are revealed' },
                { id: 'WINNER_PREDICTION', title: '3. Winner Prediction', desc: 'Fans predict winners among official nominees' },
                { id: 'RESULTS', title: '4. Official Results', desc: 'Show official winners vs fan predictions' }
              ].map((phase) => {
                const isCurrent = campaign?.currentPhase === phase.id;
                return (
                  <div
                    key={phase.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-neutral-800 bg-neutral-900/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{phase.title}</div>
                      <div className="text-[11px] text-neutral-400 mt-1 leading-snug">{phase.desc}</div>
                    </div>
                    <button
                      onClick={() => handleUpdateCampaign(phase.id)}
                      disabled={isCurrent || loading}
                      className={`mt-4 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-amber-400 text-neutral-950 cursor-default'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      {isCurrent ? 'Active Phase' : 'Set as Phase'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Categories Manager */}
      {activeTab === 'categories' && (
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Award Categories</h3>
            <button
              onClick={() =>
                setEditingCategory({
                  id: '',
                  name: '',
                  slug: '',
                  officialCategory: '',
                  genre: 'General Field',
                  phase: 'NOMINATION_PREDICTION',
                  status: 'ACTIVE',
                  displayOrder: categories.length + 1,
                  maxVotesPerUser: 1,
                  description: ''
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition"
            >
              <Plus size={14} />
              <span>Add Category</span>
            </button>
          </div>

          {editingCategory && (
            <form
              onSubmit={handleSaveCategory}
              className="p-4 rounded-xl border border-amber-500/40 bg-neutral-900/90 space-y-3"
            >
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                {editingCategory.id ? 'Edit Category' : 'Create New Category'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Category Name (e.g., Best Rap Album)"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                  className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                />
                <input
                  type="text"
                  placeholder="Genre / Field (e.g., Rap / Hip-Hop)"
                  value={editingCategory.genre || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, genre: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                />
              </div>
              <textarea
                placeholder="Category description / criteria"
                value={editingCategory.description || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/40">
            {categories.map((c) => (
              <div key={c.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white">{c.name}</div>
                  <div className="text-xs text-neutral-400">
                    {c.genre} • Order: {c.displayOrder} • {c.totalVotes || 0} votes
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingCategory(c)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Candidates Manager */}
      {activeTab === 'candidates' && (
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Prediction Candidates</h3>
            <button
              onClick={() => {
                setEditingCandidate({
                  title: '',
                  subtitle: '',
                  type: 'ALBUM',
                  genre: 'Pop',
                  country: 'United States',
                  countryCode: 'US',
                  status: 'ACTIVE',
                  imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'
                });
                setSelectedCandidateCategoryId(categories[0]?.id || '');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition"
            >
              <Plus size={14} />
              <span>Add Candidate</span>
            </button>
          </div>

          {editingCandidate && (
            <form
              onSubmit={handleSaveCandidate}
              className="p-4 rounded-xl border border-amber-500/40 bg-neutral-900/90 space-y-3"
            >
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Add / Edit Candidate
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Candidate Title / Work (e.g. BRAT or Sabrina Carpenter)"
                  value={editingCandidate.title || ''}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, title: e.target.value })}
                  required
                  className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                />
                <input
                  type="text"
                  placeholder="Subtitle / Performing Artist (e.g. Charli xcx)"
                  value={editingCandidate.subtitle || ''}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, subtitle: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                />
                <select
                  value={selectedCandidateCategoryId}
                  onChange={(e) => setSelectedCandidateCategoryId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Image URL"
                  value={editingCandidate.imageUrl || ''}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, imageUrl: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Save Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex items-center gap-3"
              >
                <img
                  src={cand.imageUrl}
                  alt={cand.title}
                  className="w-12 h-12 rounded-lg object-cover bg-neutral-800 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{cand.title}</div>
                  <div className="text-[11px] text-neutral-400 truncate">{cand.subtitle}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {cand.genre} • {cand.country}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Articles CMS */}
      {activeTab === 'articles' && (
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Articles & News CMS</h3>
            <button
              onClick={() =>
                setEditingArticle({
                  title: '',
                  slug: '',
                  excerpt: '',
                  body: '',
                  featuredImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&auto=format&fit=crop&q=80',
                  author: 'Fanbase Editorial',
                  category: 'Predictions',
                  published: true
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition"
            >
              <Plus size={14} />
              <span>Create Article</span>
            </button>
          </div>

          {editingArticle && (
            <form
              onSubmit={handleSaveArticle}
              className="p-4 rounded-xl border border-amber-500/40 bg-neutral-900/90 space-y-3"
            >
              <input
                type="text"
                placeholder="Article Title"
                value={editingArticle.title || ''}
                onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
              <input
                type="text"
                placeholder="Short excerpt / lead paragraph"
                value={editingArticle.excerpt || ''}
                onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
              <textarea
                placeholder="Full article body content"
                value={editingArticle.body || ''}
                onChange={(e) => setEditingArticle({ ...editingArticle, body: e.target.value })}
                rows={5}
                required
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs font-mono"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Publish Article
                </button>
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-white">{art.title}</div>
                  <div className="text-xs text-neutral-400">
                    By {art.author} • {art.published ? 'Published' : 'Draft'}
                  </div>
                </div>
                <button
                  onClick={() => setEditingArticle(art)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Ad Slots Manager */}
      {activeTab === 'ads' && (
        <div className="space-y-4 py-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <h3 className="text-base font-bold text-white mb-1">Ad Placements</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Toggle ad placements on and off. Configured slots pull dynamically from Firestore.
            </p>

            <div className="space-y-2">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="p-3 rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{ad.name}</div>
                    <div className="text-[11px] text-neutral-400">
                      Placement: <code className="text-amber-400">{ad.placement}</code> • Provider: {ad.provider}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAd(ad)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      ad.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {ad.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Platform Settings & Legal Disclaimer */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-4 py-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Platform Settings & Mandatory Legal Notice</h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Legal Disclaimer (Required on all pages)
              </label>
              <textarea
                value={settings.disclaimerText || ''}
                onChange={(e) => setSettings({ ...settings, disclaimerText: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs leading-relaxed"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Must clearly state independent fan prediction status and Recording Academy trademark rights.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowAnon"
                checked={settings.allowAnonymousVoting ?? true}
                onChange={(e) => setSettings({ ...settings, allowAnonymousVoting: e.target.checked })}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0"
              />
              <label htmlFor="allowAnon" className="text-xs text-neutral-300">
                Allow anonymous voter sessions with rate-limit and duplicate protection
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs transition"
            >
              Save Platform Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 8: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="py-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <h3 className="text-base font-bold text-white mb-1">Security Audit Log</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Immutable log of administrative operations and suspicious voting checks in Firestore.
            </p>
            <div className="p-8 text-center text-xs text-neutral-500">
              Audit log active. All transactions tracked in Firestore collection <code className="text-neutral-400">auditLogs</code>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
