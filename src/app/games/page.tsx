'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Gamepad2,
  Search,
  Filter,
  Flame,
  Clock,
  Sparkles,
  Trophy,
  Play,
  Heart,
  ChevronRight,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CATALOG_GAMES, GAME_CATEGORIES, searchGames } from '@/lib/games/registry';
import { getFavoriteGames, getRecentSessions } from '@/lib/games/sessions';

export default function GamesPortalPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteSlugs(getFavoriteGames());
    const recents = getRecentSessions().map((s) => s.gameSlug);
    setRecentSlugs(Array.from(new Set(recents)));
  }, []);

  const filteredGames = useMemo(() => {
    return searchGames(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const featuredGames = CATALOG_GAMES.slice(0, 3);
  const trendingGames = [...CATALOG_GAMES].sort((a, b) => b.playsCount - a.playsCount);

  const favoriteGamesList = CATALOG_GAMES.filter((g) => favoriteSlugs.includes(g.slug));
  const continuePlayingList = CATALOG_GAMES.filter((g) => recentSlugs.includes(g.slug));

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      {/* Hero Ambience Glow */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[350px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[400px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Instant In-Browser Gaming Portal</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            EXPLORE THE{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              GAMEVERSE
            </span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base leading-relaxed">
            Zero installers. Zero downloads. Launch and play directly in your web browser.
          </p>
        </div>

        {/* Search & Categories Bar */}
        <div className="mb-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games, genres, tags..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-violet-500/70 text-white placeholder-white/25 text-sm outline-none transition-all"
              />
            </div>

            {/* Total Games Count Badge */}
            <span className="text-xs text-white/40 font-mono">
              Displaying {filteredGames.length} Available Browser Games
            </span>
          </div>

          {/* Categories Pill Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GAME_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/8'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Continue Playing Section (If player has recent sessions) */}
        {continuePlayingList.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h2 className="text-lg font-black text-white tracking-wide">CONTINUE PLAYING</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {continuePlayingList.map((g) => (
                <Link
                  key={g.slug}
                  href={`/play/${g.slug}`}
                  className="group p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{g.emoji}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                        {g.title}
                      </h4>
                      <span className="text-[11px] text-cyan-300/60 uppercase font-semibold">Resume Match</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Games Carousel / Spotlight */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="text-lg font-black text-white tracking-wide">FEATURED ORIGINALS</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredGames.map((game, i) => (
                <motion.div
                  key={game.slug}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative rounded-3xl border border-white/10 hover:border-violet-500/50 overflow-hidden transition-all duration-300 p-6 flex flex-col justify-between"
                  style={{
                    background: 'linear-gradient(135deg, rgba(18,18,32,0.95), rgba(25,25,50,0.9))',
                    boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: game.accentColor }}
                  />

                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                        {game.emoji}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80">
                        {game.category}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-2 group-hover:text-violet-300 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-white/50 text-xs leading-relaxed mb-6 line-clamp-3">
                      {game.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-white/40 font-mono">
                      ★ {game.rating} • {game.playsCount.toLocaleString()} plays
                    </span>
                    <Link
                      href={
                        game.slug === 'teen-patti'
                          ? '/games/teen-patti'
                          : game.slug === 'ludo'
                          ? '/games/ludo'
                          : game.slug === 'tic-tac-toe'
                          ? '/games/tic-tac-toe'
                          : `/play/${game.slug}`
                      }
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 flex items-center gap-1.5 shadow-lg shadow-violet-600/30 group-hover:translate-x-1 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>PLAY NOW</span>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All / Filtered Games Grid */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-lg font-black text-white tracking-wide">
                {searchQuery
                  ? `RESULTS FOR "${searchQuery.toUpperCase()}"`
                  : selectedCategory === 'all'
                  ? 'ALL IN-BROWSER GAMES'
                  : `${selectedCategory.toUpperCase()} GAMES`}
              </h2>
            </div>
          </div>

          {filteredGames.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-3xl bg-white/3 border border-white/8">
              <Gamepad2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Games Found</h3>
              <p className="text-white/40 text-xs max-w-sm mx-auto mb-4">
                No catalog games matched your current search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-violet-600/30 text-violet-300 text-xs font-bold hover:bg-violet-600/50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGames.map((game, i) => (
                <div
                  key={game.slug}
                  className="group rounded-2xl border border-white/8 hover:border-violet-500/40 transition-all duration-300 p-5 flex flex-col justify-between"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,15,25,0.9), rgba(20,20,40,0.85))',
                  }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: `${game.accentColor}20`,
                        border: `1px solid ${game.accentColor}40`,
                      }}
                    >
                      {game.emoji}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-black text-base truncate group-hover:text-violet-300 transition-colors">
                          {game.title}
                        </h4>
                        <span className="text-[10px] uppercase font-bold text-white/40">
                          {game.category}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs line-clamp-2 leading-relaxed">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono">
                      <span>★ {game.rating}</span>
                      <span>•</span>
                      <span>{game.playsCount.toLocaleString()} plays</span>
                    </div>

                    <Link
                      href={
                        game.slug === 'teen-patti'
                          ? '/games/teen-patti'
                          : game.slug === 'ludo'
                          ? '/games/ludo'
                          : game.slug === 'tic-tac-toe'
                          ? '/games/tic-tac-toe'
                          : `/play/${game.slug}`
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-violet-600 font-bold text-xs text-white transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play Now</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
