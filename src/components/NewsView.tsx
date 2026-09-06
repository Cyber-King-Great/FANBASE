import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { Newspaper, Calendar, User, ArrowLeft, Loader2 } from 'lucide-react';
import { AdSlot } from './AdSlot';
import { fetchArticles } from '../lib/api';

interface NewsViewProps {
  initialSlug?: string;
  onSelectArticle?: (slug: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ initialSlug, onSelectArticle }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchArticles()
      .then((data: Article[]) => {
        setArticles(data || []);
        if (initialSlug) {
          const matched = (data || []).find((a) => a.slug === initialSlug);
          if (matched) setSelectedArticle(matched);
        }
      })
      .catch(() => {
        setArticles([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialSlug]);

  if (selectedArticle) {
    return (
      <div className="w-full max-w-3xl mx-auto py-6">
        <button
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to All Articles</span>
        </button>

        <article className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          {selectedArticle.featuredImage && (
            <div className="w-full aspect-[21/9] max-h-80 overflow-hidden bg-neutral-800">
              <img
                src={selectedArticle.featuredImage}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                {selectedArticle.category || 'Awards News'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User size={13} />
                <span>{selectedArticle.author || 'Fanbase Editorial'}</span>
              </span>
              {selectedArticle.createdAt && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    <span>{new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug mb-4">
              {selectedArticle.title}
            </h1>

            {selectedArticle.excerpt && (
              <p className="text-base text-neutral-300 font-medium italic border-l-2 border-amber-400 pl-4 mb-6 leading-relaxed">
                {selectedArticle.excerpt}
              </p>
            )}

            <AdSlot placement="article_middle" />

            <div className="prose prose-invert max-w-none text-neutral-300 text-sm leading-relaxed whitespace-pre-line space-y-4">
              {selectedArticle.body}
            </div>

            <AdSlot placement="article_bottom" />
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Newspaper size={18} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Awards News & Editorial
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Awards Season Analysis
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Editorial perspectives, predictions breakdown, and race analysis from the Fanbase team.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-neutral-900/60 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 my-4">
          <Newspaper size={36} className="text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-300">No articles published yet</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Analysis, nominee breakdowns, and race predictions will be published here by the editorial team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {articles.map((art) => (
            <article
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 transition cursor-pointer overflow-hidden flex flex-col group"
            >
              {art.featuredImage && (
                <div className="w-full aspect-video overflow-hidden bg-neutral-800">
                  <img
                    src={art.featuredImage}
                    alt={art.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide mb-1">
                  {art.category || 'Analysis'}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed flex-1">
                  {art.excerpt}
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
                  <span>By {art.author || 'Fanbase'}</span>
                  <span>{art.createdAt ? new Date(art.createdAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
