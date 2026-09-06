import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { VotingInterface } from './components/VotingInterface';
import { LeaderboardView } from './components/LeaderboardView';
import { CountryView } from './components/CountryView';
import { NewsView } from './components/NewsView';
import { ResultsView } from './components/ResultsView';
import { AdminView } from './components/AdminView';
import { SearchModal } from './components/SearchModal';
import { Category, Campaign } from './types';
import { fetchOverviewStats, fetchCategories, fetchCurrentCampaign } from './lib/api';

export function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [overviewStats, setOverviewStats] = useState<any>({ totalVotes: 0, countriesCount: 0 });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string>('');

  const loadCoreData = async () => {
    try {
      const [resStats, resCats, resCamp] = await Promise.all([
        fetchOverviewStats(),
        fetchCategories(),
        fetchCurrentCampaign()
      ]);

      if (resStats) setOverviewStats(resStats);
      if (resCats) {
        setCategories(resCats);
        if (!activeCategorySlug && resCats.length > 0) {
          setActiveCategorySlug(resCats[0].slug);
        }
      }
      if (resCamp) setCampaign(resCamp);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCoreData();
  }, []);

  const handleSelectCategory = (slug: string) => {
    setActiveCategorySlug(slug);
    setCurrentView('predict');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (slug: string) => {
    setSelectedArticleSlug(slug);
    setCurrentView('news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-400 selection:text-neutral-950 antialiased">
      {/* Sticky App Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
        totalVotes={overviewStats?.totalVotes || 0}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-4 sm:pt-6">
        {currentView === 'home' && (
          <HomeView
            campaign={campaign}
            overviewStats={overviewStats}
            categories={categories}
            onSelectCategory={handleSelectCategory}
            onStartPredicting={() => handleNavigate('predict')}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'predict' && (
          <VotingInterface
            categories={categories}
            activeCategorySlug={activeCategorySlug}
            onSelectCategory={(slug) => setActiveCategorySlug(slug)}
            onVoteSuccess={loadCoreData}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            categories={categories}
            initialCategorySlug={activeCategorySlug}
            onNavigateToCategory={handleSelectCategory}
          />
        )}

        {currentView === 'countries' && (
          <CountryView onStartPredicting={() => handleNavigate('predict')} />
        )}

        {currentView === 'news' && (
          <NewsView
            initialSlug={selectedArticleSlug}
            onSelectArticle={(slug) => setSelectedArticleSlug(slug)}
          />
        )}

        {currentView === 'results' && (
          <ResultsView
            categories={categories}
            currentPhase={campaign?.currentPhase || 'NOMINATION_PREDICTION'}
            onNavigateToPredict={() => handleNavigate('predict')}
          />
        )}

        {currentView === 'admin' && (
          <AdminView onDataChanged={loadCoreData} />
        )}
      </main>

      {/* Mandatory Legal Trademark Disclaimer and Navigation Footer */}
      <Footer
        disclaimer={campaign?.disclaimer}
        onNavigate={handleNavigate}
      />

      {/* Global Search Dialog */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectCategory={handleSelectCategory}
        onSelectArtist={() => handleNavigate('predict')}
        onSelectArticle={handleSelectArticle}
      />
    </div>
  );
}

export default App;
