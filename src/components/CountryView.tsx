import React, { useState, useEffect } from 'react';
import { Globe, Flag, BarChart2, Loader2, ArrowRight } from 'lucide-react';
import { CountryStat } from '../types';
import { fetchCountries } from '../lib/api';

interface CountryViewProps {
  onStartPredicting: () => void;
}

export const CountryView: React.FC<CountryViewProps> = ({ onStartPredicting }) => {
  const [countries, setCountries] = useState<CountryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountries()
      .then((data) => {
        // Only countries that have actual votes recorded
        const active = (data || []).filter((c: any) => c.totalVotes > 0);
        setCountries(active);
      })
      .catch(() => {
        setCountries([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Globe size={18} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Global Fanbase Activity
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Worldwide Voting Map
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Real geographic distribution of fan predictions stored in Firebase.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-900/60 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : countries.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 my-4">
          <Globe size={36} className="text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-300">No voting activity yet</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Votes from worldwide fans will populate dynamic country breakdowns here.
          </p>
          <button
            onClick={onStartPredicting}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition"
          >
            Cast the First Vote from Your Country
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {countries.map((c) => (
            <div
              key={c.countryCode}
              className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-amber-400">
                  {c.countryCode}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{c.countryName}</div>
                  {c.topCandidateName && (
                    <div className="text-xs text-neutral-400">
                      Top Pick: <span className="text-neutral-300">{c.topCandidateName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-white">{c.totalVotes}</div>
                <div className="text-[11px] text-neutral-400">
                  {c.totalVotes === 1 ? 'prediction' : 'predictions'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
