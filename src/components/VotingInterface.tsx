import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Award,
  ChevronRight,
  Share2,
  AlertCircle,
  Loader2,
  Info,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { Category, Candidate } from '../types';
import { getAnonymousSessionId, getVoterCountry, getVotedCategories, markCategoryVoted } from '../lib/session';
import { ShareModal } from './ShareModal';
import { AdSlot } from './AdSlot';
import { fetchCategoryBySlug, postVote } from '../lib/api';

interface VotingInterfaceProps {
  categories: Category[];
  activeCategorySlug?: string;
  onSelectCategory: (slug: string) => void;
  onVoteSuccess?: () => void;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  categories,
  activeCategorySlug,
  onSelectCategory,
  onVoteSuccess
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voteResult, setVoteResult] = useState<any | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [votedMap, setVotedMap] = useState<Record<string, string>>({});

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Sync voted categories from local session storage
  useEffect(() => {
    setVotedMap(getVotedCategories());
  }, []);

  // Determine current active category
  useEffect(() => {
    if (categories.length === 0) return;
    const current =
      categories.find((c) => c.slug === activeCategorySlug) || categories[0];
    setSelectedCategory(current);
  }, [categories, activeCategorySlug]);

  // Load candidates and stats whenever the category changes
  useEffect(() => {
    if (!selectedCategory) return;
    setLoadingCandidates(true);
    setErrorMessage(null);
    setSelectedCandidateId(null);
    setVoteResult(null);

    fetchCategoryBySlug(selectedCategory.slug)
      .then((data) => {
        if (!data) throw new Error('Failed to load category data');
        setCandidates(data.candidates || []);
        // Check if user already voted in this category
        const previousVote = votedMap[selectedCategory.id];
        if (previousVote) {
          const votedCand = (data.candidates || []).find((c: any) => c.id === previousVote);
          if (votedCand) {
            setSelectedCandidateId(votedCand.id);
            setVoteResult({
              alreadyVoted: true,
              candidateName: votedCand.title,
              categoryName: selectedCategory.name
            });
          }
        }
      })
      .catch(() => {
        setErrorMessage('Unable to load candidates from database. Please try again.');
      })
      .finally(() => {
        setLoadingCandidates(false);
      });
  }, [selectedCategory, votedMap]);

  // Submit vote through backend
  const handleVoteSubmit = async () => {
    if (!selectedCategory || !selectedCandidateId || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    const voterSession = getAnonymousSessionId();
    const countryInfo = getVoterCountry();

    try {
      const result = await postVote({
        campaignId: selectedCategory.campaignId || 'grammy-2027',
        categoryId: selectedCategory.id,
        candidateId: selectedCandidateId,
        anonymousSessionId: voterSession,
        country: countryInfo.country,
        countryCode: countryInfo.countryCode
      });

      if (result && result.success) {
        // Confetti explosion
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#e5a93c', '#ffffff', '#f59e0b', '#38bdf8']
          });
        } catch {
          // ignore
        }

        markCategoryVoted(selectedCategory.id, selectedCandidateId);
        setVotedMap((prev) => ({ ...prev, [selectedCategory.id]: selectedCandidateId }));
        setVoteResult(result);

        // Refresh category candidates to show updated percentage & ranks
        const freshData = await fetchCategoryBySlug(selectedCategory.slug);
        if (freshData) {
          setCandidates(freshData.candidates || []);
        }

        if (onVoteSuccess) onVoteSuccess();
      } else {
        if (result.error === 'DUPLICATE_VOTE') {
          markCategoryVoted(selectedCategory.id, selectedCandidateId);
          setVotedMap((prev) => ({ ...prev, [selectedCategory.id]: selectedCandidateId }));
          setErrorMessage('You have already submitted your prediction for this category.');
          setVoteResult({
            alreadyVoted: true,
            candidateName: candidates.find((c) => c.id === selectedCandidateId)?.title || 'Selected Candidate',
            categoryName: selectedCategory.name
          });
        } else {
          setErrorMessage(result.message || 'Voting is temporarily unavailable. Please try again.');
        }
      }
    } catch {
      setErrorMessage('Network error submitting vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Find next category index
  const currentIndex = categories.findIndex((c) => c.id === selectedCategory?.id);
  const nextCategory =
    currentIndex >= 0 && currentIndex < categories.length - 1
      ? categories[currentIndex + 1]
      : null;

  const handleNextCategory = () => {
    if (nextCategory) {
      onSelectCategory(nextCategory.slug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const selectedCandidateObj = candidates.find((c) => c.id === selectedCandidateId);
  const hasVotedInThisCategory = Boolean(votedMap[selectedCategory?.id || '']);

  return (
    <div className="w-full max-w-4xl mx-auto pb-28">
      {/* Horizontal Sticky Category Chips / Selector */}
      <div className="sticky top-14 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 sm:rounded-xl sm:border mb-4">
        <div
          ref={categoryScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        >
          {categories.map((cat, idx) => {
            const isActive = selectedCategory?.id === cat.id;
            const isVoted = Boolean(votedMap[cat.id]);

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.slug);
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
                    : isVoted
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/40'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {isVoted && <Check size={13} className={isActive ? 'text-neutral-950' : 'text-emerald-400'} />}
                <span>{cat.name}</span>
                {cat.totalVotes > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-neutral-950/20 text-neutral-900' : 'bg-neutral-800 text-neutral-400'}`}>
                    {cat.totalVotes}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Header */}
      {selectedCategory && (
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {selectedCategory.genre || 'General Field'}
              </span>
              <span className="text-xs text-neutral-400">
                Phase: <span className="text-neutral-300 font-medium">Nomination Prediction</span>
              </span>
            </div>

            {selectedCategory.totalVotes > 0 ? (
              <div className="text-xs font-medium text-neutral-300 flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-800">
                <BarChart2 size={13} className="text-amber-400" />
                <span>{selectedCategory.totalVotes} fan predictions recorded</span>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                No predictions yet. Be the first to vote!
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {selectedCategory.name}
          </h2>
          {selectedCategory.description && (
            <p className="text-xs text-neutral-400 mt-0.5 max-w-2xl">
              {selectedCategory.description}
            </p>
          )}
        </div>
      )}

      {/* Error message if any */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Ad slot */}
      <AdSlot placement="category_top" />

      {/* Candidates List / Grid */}
      {loadingCandidates ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 animate-pulse">
              <div className="w-full aspect-square bg-neutral-800 rounded-lg mb-2" />
              <div className="h-4 bg-neutral-800 rounded w-3/4 mb-1" />
              <div className="h-3 bg-neutral-800/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 my-6">
          <Award size={36} className="text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-300">No candidates added yet</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Candidates for this category have not been entered by the administrator yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Post-vote Banner if user has already voted */}
          {hasVotedInThisCategory && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-300">
                    Your prediction is recorded!
                  </div>
                  <div className="text-[11px] text-neutral-300">
                    You predicted: <strong className="text-white">{selectedCandidateObj?.title || 'Selected Candidate'}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-white border border-neutral-700 transition"
                >
                  <Share2 size={13} className="text-amber-400" />
                  <span>Share</span>
                </button>
                {nextCategory && (
                  <button
                    onClick={handleNextCategory}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition shadow-sm"
                  >
                    <span>Next: {nextCategory.name}</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Compact 2-Column Mobile Grid / 4-Col Desktop Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {candidates.map((cand) => {
              const isSelected = selectedCandidateId === cand.id;
              const isUserVote = votedMap[selectedCategory?.id || ''] === cand.id;
              const percentage = cand.percentage || 0;

              return (
                <div
                  key={cand.id}
                  onClick={() => {
                    if (!hasVotedInThisCategory) {
                      setSelectedCandidateId(cand.id);
                    }
                  }}
                  className={`group relative rounded-xl p-2 sm:p-2.5 flex flex-col transition cursor-pointer select-none text-left overflow-hidden ${
                    isSelected
                      ? 'bg-neutral-900 border-2 border-amber-400 shadow-lg shadow-amber-400/10'
                      : isUserVote
                      ? 'bg-neutral-900 border border-emerald-500/80 shadow-md shadow-emerald-500/10'
                      : 'bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800/90 hover:border-neutral-700'
                  }`}
                >
                  {/* Image container with selection radio/check badge */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-800 mb-2">
                    <img
                      src={cand.imageUrl}
                      alt={cand.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Radio/Check overlay badge */}
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition shadow-md ${
                          isSelected || isUserVote
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'bg-black/60 backdrop-blur-sm border border-white/40 text-transparent'
                        }`}
                      >
                        <Check size={14} className={isSelected || isUserVote ? 'opacity-100' : 'opacity-0'} />
                      </div>
                    </div>

                    {/* Rank Badge if votes exist */}
                    {cand.votes > 0 && cand.rank && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-bold text-amber-400 border border-white/10 flex items-center gap-1">
                        <span>#{cand.rank}</span>
                        <span>•</span>
                        <span>{percentage}%</span>
                      </div>
                    )}
                  </div>

                  {/* Candidate Name & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                      {cand.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {cand.subtitle}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="truncate">{cand.genre || cand.country}</span>
                      {hasVotedInThisCategory && (
                        <span className="font-semibold text-neutral-300 ml-1 shrink-0">
                          {cand.votes} {cand.votes === 1 ? 'vote' : 'votes'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Percentage Progress Bar when votes exist */}
                  {hasVotedInThisCategory && (
                    <div className="w-full mt-2">
                      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isUserVote ? 'bg-amber-400' : 'bg-neutral-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Middle Ad Slot */}
      <AdSlot placement="category_middle" />

      {/* Sticky Bottom One-Thumb Vote Bar */}
      {!hasVotedInThisCategory && selectedCandidateObj && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/90 p-3 sm:p-4 shadow-2xl animate-slideUp">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700">
              <img
                src={selectedCandidateObj.imageUrl}
                alt={selectedCandidateObj.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-amber-400 font-semibold tracking-wide uppercase truncate">
                Selected for {selectedCategory?.name}
              </div>
              <div className="text-sm font-bold text-white truncate">
                {selectedCandidateObj.title}
              </div>
            </div>

            <button
              onClick={handleVoteSubmit}
              disabled={submitting}
              className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-neutral-950 font-black text-xs uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-lg shadow-amber-400/20 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check size={16} className="stroke-[3]" />
                  <span>Vote</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {selectedCandidateObj && selectedCategory && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          candidateName={selectedCandidateObj.title}
          categoryName={selectedCategory.name}
          campaignYear={2027}
        />
      )}
    </div>
  );
};
