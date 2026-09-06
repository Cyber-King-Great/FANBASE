import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getVoterCountry } from '../lib/session';
import { postNewsletter } from '../lib/api';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    setStatus('idle');
    try {
      const countryInfo = getVoterCountry();
      const data = await postNewsletter({
        email,
        country: countryInfo.country,
        favoriteArtist: ''
      });
      if (data && data.success) {
        setStatus('success');
        setMessage('You are now subscribed to GRAMMY prediction updates!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage((data && data.message) || 'Subscription failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="my-10 p-6 md:p-8 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-md mx-auto relative z-10">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Mail size={22} />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Stay Updated on Awards Predictions</h3>
        <p className="text-sm text-neutral-400 mt-1 mb-5">
          Get weekly prediction leaderboard shifts, nominee analysis, and voting milestone alerts.
        </p>

        {status === 'success' ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-400 text-sm">
            <CheckCircle size={18} />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-400 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0 shadow-lg shadow-amber-500/10"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>Subscribe</span>
            </button>
          </form>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 mt-2">
            <AlertCircle size={14} />
            <span>{message}</span>
          </div>
        )}

        <p className="text-[11px] text-neutral-400 mt-3">
          Zero spam. Unsubscribe anytime. We respect your privacy.
        </p>
      </div>
    </section>
  );
};
