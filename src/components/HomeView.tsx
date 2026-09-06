import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Trophy,
  Globe,
  Award,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Category, Campaign } from '../types';
import { AdSlot } from './AdSlot';
import { NewsletterSection } from './NewsletterSection';

interface HomeViewProps {
  campaign: Campaign | null;
  overviewStats: any;
  categories: Category[];
  onSelectCategory: (slug: string) => void;
  onStartPredicting: () => void;
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  campaign,
  overviewStats,
  categories,
  onSelectCategory,
  onStartPredicting,
  onNavigate
}) => {
  const totalVotes = overviewStats?.totalVotes ?? 0;
  const countriesCount = overviewStats?.countriesCount ?? 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-4">
      {/* Dynamic Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 p-6 sm:p-10 text-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            <Sparkles size={13} />
            <span>GRAMMY® 2027 FAN PREDICTIONS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
            Who deserves a GRAMMY nomination?
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl mx-auto mb-6">
            Predict the artists, albums, and songs you believe deserve recognition for the 2027 GRAMMYs. 
            Real votes, real community rankings, zero fake statistics.
          </p>

          {/* Real Live Prediction Count */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-neutral-900/80 border border-neutral-800 mb-8">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-xs text-neutral-300">
              {totalVotes > 0 ? (
                <>
                  <strong className="text-white font-black text-sm">{totalVotes}</strong>{' '}
                  verified fan predictions submitted across{' '}
                  <strong className="text-white font-bold">{countriesCount}</strong>{' '}
                  {countriesCount === 1 ? 'country' : 'countries'}
                </>
              ) : (
                <span>No predictions yet recorded in Firebase. Be the first to vote!</span>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <div>
            <button
              onClick={onStartPredicting}
              className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-neutral-950 font-black text-sm uppercase tracking-wider flex items-center gap-2.5 mx-auto shadow-xl shadow-amber-400/20 transition group"
            >
              <span>Start Predicting</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Top Ad Slot */}
      <AdSlot placement="homepage_top" />

      {/* Trending Categories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Award Categories
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select a category to cast your prediction or view current fan consensus.
            </p>
          </div>
          <button
            onClick={onStartPredicting}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="group p-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span className="text-amber-400">{cat.genre || 'General Field'}</span>
                  {cat.totalVotes > 0 ? (
                    <span className="text-neutral-400 font-mono">
                      {cat.totalVotes} {cat.totalVotes === 1 ? 'vote' : 'votes'}
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[10px]">Open for votes</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                  {cat.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description || 'Predict who deserves a nomination in this prestigious category.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 group-hover:text-amber-400 transition">
                <span className="font-semibold">Cast Prediction</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Middle Ad Slot */}
      <AdSlot placement="homepage_middle" />

      {/* How Predictions Work & Fast Rules */}
      <section className="p-6 sm:p-8 rounded-3xl border border-neutral-800 bg-neutral-900/40">
        <h2 className="text-lg sm:text-xl font-black text-white mb-1">
          The Fanbase Integrity Standard
        </h2>
        <p className="text-xs text-neutral-400 mb-6">
          How our independent prediction engine ensures fair, authentic fan consensus.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <BarChart3 size={18} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Single Database Truth</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every percentage and ranking is calculated dynamically from real Firestore transactions with zero simulated numbers.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 size={18} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Anti-Fraud & Duplicate Shield</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Strict category vote limits, session fingerprinting, and rate-limiting protect each category from bot manipulation.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
              <Globe size={18} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Worldwide Fan Voices</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              See what music lovers are championing across the US, UK, Latin America, Africa, Asia, and globally.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <NewsletterSection />

      {/* Bottom Ad Slot */}
      <AdSlot placement="homepage_bottom" />
    </div>
  );
};
