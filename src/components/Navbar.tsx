import React, { useState } from 'react';
import { Search, Trophy, Globe, Newspaper, Shield, Menu, X, CheckSquare, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSearch: () => void;
  totalVotes?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  totalVotes = 0
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'predict', label: 'Predict', icon: CheckSquare, badge: 'Vote' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'countries', label: 'Countries', icon: Globe },
    { id: 'news', label: 'News & Analysis', icon: Newspaper },
    { id: 'results', label: 'Results', icon: Sparkles }
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center font-black text-neutral-950 text-base shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
            F
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-lg tracking-tight text-white group-hover:text-amber-400 transition">
                Fanbase
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                2027
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 leading-none mt-1 hidden sm:block">
              Who deserves a GRAMMY nomination?
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-400' : 'text-neutral-400'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] uppercase font-bold px-1 rounded bg-amber-400 text-neutral-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls: Search, Live Votes Pill, Admin Shortcut */}
        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            aria-label="Search predictions"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs transition"
          >
            <Search size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Admin shortcut button */}
          <button
            onClick={() => handleNavClick('admin')}
            title="Admin Dashboard"
            className={`p-2 rounded-lg border text-xs transition ${
              currentView === 'admin'
                ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Shield size={14} />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 p-4 space-y-2 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-neutral-950 text-white' : 'bg-amber-400 text-neutral-950'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
