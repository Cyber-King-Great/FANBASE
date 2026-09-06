import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Award, CheckCircle2, Clock } from 'lucide-react';
import { Category } from '../types';

interface ResultsViewProps {
  categories: Category[];
  currentPhase?: string;
  onNavigateToPredict: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  categories,
  currentPhase = 'NOMINATION_PREDICTION',
  onNavigateToPredict
}) => {
  const isNominationPhase = currentPhase === 'NOMINATION_PREDICTION' || currentPhase === 'NOMINATION_VOTING';

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Official Nominations & Results
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Fan Predictions vs. The Recording Academy
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Comparing grassroots community predictions against official GRAMMY announcements.
        </p>
      </div>

      {isNominationPhase ? (
        <div className="p-8 sm:p-12 rounded-3xl border border-neutral-800 bg-neutral-900/50 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Clock size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Nomination Predictions in Progress</h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            The Recording Academy has not yet announced the official nominations for GRAMMY 2027.
            Fans are actively voting to determine who deserves recognition.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateToPredict}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20"
            >
              Cast Your Predictions Now
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-neutral-400">
            Official winners and fan consensus matching scores will be updated live here during the ceremony.
          </p>
        </div>
      )}
    </div>
  );
};
