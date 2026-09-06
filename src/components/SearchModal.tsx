import React, { useState, useEffect } from 'react';
import { Search, X, Music, User, Award, FileText, Loader2, ArrowRight } from 'lucide-react';
import { searchGlobal } from '../lib/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (slug: string) => void;
  onSelectArtist: (slug: string) => void;
  onSelectArticle: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  onSelectArtist,
  onSelectArticle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    candidates: any[];
    artists: any[];
    categories: any[];
    articles: any[];
  }>({ candidates: [], artists: [], categories: [], articles: [] });

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ candidates: [], artists: [], categories: [], articles: [] });
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      searchGlobal(searchTerm)
        .then((data) => {
          setResults(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const totalResults =
    results.candidates.length +
    results.artists.length +
    results.categories.length +
    results.articles.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
          <Search size={20} className="text-amber-400 shrink-0" />
          <input
            type="text"
            placeholder="Search artists, songs, categories, articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-white placeholder-neutral-500 text-base focus:outline-none"
          />
          {loading && <Loader2 size={18} className="text-neutral-400 animate-spin" />}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto divide-y divide-neutral-800/60">
          {!searchTerm.trim() ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              Type an artist name, song title, or award category to search predictions
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-neutral-400 text-sm">Searching Firebase...</div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              No matching predictions found in database for "{searchTerm}".
            </div>
          ) : (
            <>
              {/* Categories */}
              {results.categories.length > 0 && (
                <div className="py-3">
                  <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 mb-2 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-400" />
                    <span>Categories ({results.categories.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onSelectCategory(cat.slug);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-800/80 flex items-center justify-between group transition"
                      >
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-amber-400 transition">
                            {cat.name}
                          </div>
                          <div className="text-xs text-neutral-400">{cat.genre}</div>
                        </div>
                        <ArrowRight size={16} className="text-neutral-500 group-hover:text-amber-400 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidates */}
              {results.candidates.length > 0 && (
                <div className="py-3">
                  <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 mb-2 flex items-center gap-1.5">
                    <Music size={14} className="text-amber-400" />
                    <span>Prediction Candidates ({results.candidates.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.candidates.map((cand) => (
                      <div
                        key={cand.id}
                        className="p-2.5 rounded-xl bg-neutral-800/40 flex items-center gap-3"
                      >
                        <img
                          src={cand.imageUrl}
                          alt={cand.title}
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{cand.title}</div>
                          <div className="text-xs text-neutral-400 truncate">
                            {cand.subtitle} • {cand.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists */}
              {results.artists.length > 0 && (
                <div className="py-3">
                  <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 mb-2 flex items-center gap-1.5">
                    <User size={14} className="text-amber-400" />
                    <span>Artists ({results.artists.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.artists.map((artist) => (
                      <button
                        key={artist.id}
                        onClick={() => {
                          onSelectArtist(artist.slug);
                          onClose();
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-neutral-800/80 flex items-center justify-between group transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-9 h-9 rounded-full object-cover bg-neutral-800"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-amber-400 transition">
                              {artist.name}
                            </div>
                            <div className="text-xs text-neutral-400">{artist.country}</div>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-neutral-500 group-hover:text-amber-400 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles */}
              {results.articles.length > 0 && (
                <div className="py-3">
                  <div className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 mb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-400" />
                    <span>Articles & Analysis ({results.articles.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.articles.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => {
                          onSelectArticle(art.slug);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-800/80 flex items-center justify-between group transition"
                      >
                        <div className="truncate">
                          <div className="text-sm font-medium text-white group-hover:text-amber-400 truncate">
                            {art.title}
                          </div>
                          <div className="text-xs text-neutral-400 truncate">{art.excerpt}</div>
                        </div>
                        <ArrowRight size={16} className="text-neutral-500 group-hover:text-amber-400 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
