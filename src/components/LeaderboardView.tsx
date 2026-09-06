import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { Trophy, TrendingUp, Filter, Loader2, Music } from 'lucide-react';
import { AdSlot } from './AdSlot';
import { fetchLeaderboard } from '../lib/api';

interface LeaderboardViewProps {
  categories: Category[];
  initialCategorySlug?: string;
  onNavigateToCategory: (slug: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  categories,
  initialCategorySlug,
  onNavigateToCategory
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialCategorySlug) {
      const match = categories.find((c) => c.slug === initialCategorySlug);
      if (match) {
        setSelectedCategoryId(match.id);
      }
    }
  }, [initialCategorySlug, categories]);

  useEffect(() => {
    setLoading(true);
    const catId = selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined;

    fetchLeaderboard(catId)
      .then((data) => {
        setLeaderboardData(data || []);
      })
      .catch(() => {
        setLeaderboardData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCategoryId]);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Trophy size={18} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Realtime Standings
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Fan Predictions Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Ranked live according to verified fan prediction votes stored in Firebase.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition shrink-0 ${
            selectedCategoryId === 'all'
              ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
              : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
          }`}
        >
          Overall Top Predicted
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition shrink-0 ${
              selectedCategoryId === cat.id
                ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <AdSlot placement="leaderboard_top" />

      {/* Leaderboard Table / Cards */}
      {loading ? (
        <div className="space-y-2 py-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-900/60 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 my-4">
          <Trophy size={36} className="text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-300">No predictions yet</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Be the first to vote and set the pace on the GRAMMY 2027 leaderboard!
          </p>
          {activeCategory && (
            <button
              onClick={() => onNavigateToCategory(activeCategory.slug)}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition"
            >
              Vote in {activeCategory.name}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mobile Card List / Desktop Table */}
          {leaderboardData.map((item, idx) => {
            const isFirst = item.rank === 1;
            const isTop3 = item.rank <= 3;

            return (
              <div
                key={item.id || idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border-amber-500/40 shadow-sm'
                    : isTop3
                    ? 'bg-neutral-900/90 border-neutral-800'
                    : 'bg-neutral-900/50 border-neutral-800/60'
                }`}
              >
                {/* Rank & Image & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isFirst
                        ? 'bg-amber-400 text-neutral-950'
                        : item.rank === 2
                        ? 'bg-neutral-300 text-neutral-950'
                        : item.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'text-neutral-500 font-mono'
                    }`}
                  >
                    {item.rank}
                  </div>

                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-11 h-11 rounded-lg object-cover bg-neutral-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                      <span className="truncate">{item.title}</span>
                      {isFirst && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                          Leader
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">
                      {item.subtitle} • {item.genre || item.country}
                    </div>
                  </div>
                </div>

                {/* Vote Count & Percentage */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-white">
                    {item.votes} <span className="text-[11px] font-normal text-neutral-400">{item.votes === 1 ? 'vote' : 'votes'}</span>
                  </div>
                  <div className="text-xs font-semibold text-amber-400">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdSlot placement="leaderboard_bottom" />
    </div>
  );
};
