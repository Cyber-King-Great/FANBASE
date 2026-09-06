import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface FooterProps {
  disclaimer?: string;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ disclaimer, onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const legalText =
    disclaimer ||
    'GRAMMY® is a trademark of The Recording Academy. This website is an independent fan prediction platform and is not affiliated with, sponsored by, or endorsed by The Recording Academy.';

  return (
    <footer className="w-full border-t border-neutral-800/80 bg-neutral-950 text-neutral-400 py-10 mt-16 text-xs">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Mandatory Legal Trademark Disclaimer Box */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Mandatory Legal Trademark Notice
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {legalText}
            </p>
          </div>
        </div>

        {/* Links & Branding */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800/60">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm">Fanbase</span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-400 text-xs">“Who deserves a GRAMMY nomination?”</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-neutral-400">
            <button
              onClick={() => onNavigate('predict')}
              className="hover:text-amber-400 transition"
            >
              Cast Predictions
            </button>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="hover:text-amber-400 transition"
            >
              Leaderboard
            </button>
            <button
              onClick={() => onNavigate('countries')}
              className="hover:text-amber-400 transition"
            >
              Country Distribution
            </button>
            <button
              onClick={() => onNavigate('news')}
              className="hover:text-amber-400 transition"
            >
              Editorial News
            </button>
            <button
              onClick={() => onNavigate('admin')}
              className="hover:text-amber-400 transition"
            >
              Admin Controls
            </button>
          </div>

          <div className="text-[11px] text-neutral-500">
            © {currentYear} Fanbase. Independent community prediction engine.
          </div>
        </div>
      </div>
    </footer>
  );
};
