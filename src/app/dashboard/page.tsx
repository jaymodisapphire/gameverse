'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Trophy,
  Shield,
  Zap,
  LogOut,
  Edit3,
  Check,
  X,
  Play,
  Flame,
  Award,
  Sparkles,
  RefreshCw,
  Home,
  CheckCircle2,
  AlertCircle,
  Heart,
  Clock,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { CATALOG_GAMES } from '@/lib/games/registry';
import {
  getFavoriteGames,
  getRecentSessions,
  getLocalHighScore,
  LocalSessionRecord,
} from '@/lib/games/sessions';

const AVATAR_PRESETS = ['GV', 'SK', 'PQ', 'NB', 'CW', 'SF', 'VR'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile, isConfigured } = useAuth();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url || 'GV');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [recentSessions, setRecentSessions] = useState<LocalSessionRecord[]>([]);

  useEffect(() => {
    setFavoriteSlugs(getFavoriteGames());
    setRecentSessions(getRecentSessions());
  }, []);

  const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player';
  const playerId = profile?.player_id || 'GV-849201';
  const level = profile?.level || 1;
  const xp = profile?.xp || 150;
  const wins = profile?.wins || 0;
  const losses = profile?.losses || 0;
  const totalGames = profile?.total_games || wins + losses + recentSessions.length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const handleSaveProfile = async () => {
    if (!newUsername.trim()) {
      setFeedback({ type: 'error', message: 'Username cannot be blank.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { error } = await updateProfile({
      username: newUsername.trim(),
      avatar_url: selectedAvatar,
    });

    setIsSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: error });
    } else {
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditingUsername(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const playableGames = CATALOG_GAMES;
  const favoriteGames = CATALOG_GAMES.filter((g) => favoriteSlugs.includes(g.slug));

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden pb-16">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/60 border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-black tracking-wider bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                GAME
              </span>
              <span className="text-base font-black tracking-wider text-white">VERSE</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isConfigured ? (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Connected</span>
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold" title="To link your live database, add NEXT_PUBLIC_SUPABASE_URL to Vercel">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Demo Mode</span>
              </span>
            )}
            <Link
              href="/games"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-bold border border-violet-500/30 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Game Portal</span>
            </Link>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Hub</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* Banner */}
        {!isConfigured && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet-950/50 via-indigo-950/40 to-blue-950/30 border border-violet-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-violet-300">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-white">Step 3 Browser Gaming Portal: </span>
                <span>In-browser games run live. High scores and sessions persist in real-time.</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 font-mono font-bold text-[10px]">
              CANVAS ENGINES ACTIVE
            </span>
          </div>
        )}

        {/* Feedback message */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-3.5 rounded-xl flex items-center gap-2.5 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </motion.div>
        )}

        {/* Player Profile Hero Card */}
        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,28,0.95), rgba(20,20,45,0.9))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.12)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-500 to-indigo-500" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Player Info Left */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-violet-600/30 border border-white/20">
                  {selectedAvatar}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-black flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-100 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="px-3 py-1 rounded-lg bg-white/10 border border-violet-500/60 text-white font-bold text-lg outline-none"
                      />
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingUsername(false);
                          setNewUsername(username);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-white">{username}</h2>
                      <button
                        onClick={() => {
                          setNewUsername(username);
                          setIsEditingUsername(true);
                        }}
                        className="p-1 rounded-md text-white/40 hover:text-white transition-colors cursor-pointer"
                        title="Edit Username"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <span className="px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono text-xs font-bold">
                    {playerId}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Shield className="w-3.5 h-3.5" /> Verified Gamer
                  </span>
                  <span>•</span>
                  <span>Level {level} Pro</span>
                  <span>•</span>
                  <span>{user?.email || 'player@gameverse.gg'}</span>
                </div>

                <div className="mt-3.5 w-64 sm:w-80">
                  <div className="flex justify-between text-[11px] font-semibold text-white/60 mb-1">
                    <span>XP Progress</span>
                    <span>{xp} / 1000 XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, (xp / 1000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Selector Switcher */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                Avatar Emblem
              </span>
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av}
                    onClick={() => {
                      setSelectedAvatar(av);
                      updateProfile({ avatar_url: av });
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-violet-600 text-white ring-2 ring-violet-400 scale-105'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Player Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          <div className="p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-violet-500/30 transition-all">
            <div className="flex items-center justify-between text-violet-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Total Sessions</span>
              <Gamepad2 className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{totalGames}</p>
            <span className="text-[11px] text-white/40 mt-1 block">Live game plays</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Best Score</span>
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {Math.max(
                getLocalHighScore('neon-snake'),
                getLocalHighScore('space-defender'),
                getLocalHighScore('neon-racer'),
                0
              )}
            </p>
            <span className="text-[11px] text-white/40 mt-1 block">Across all games</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between text-cyan-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Favorites</span>
              <Heart className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{favoriteSlugs.length}</p>
            <span className="text-[11px] text-white/40 mt-1 block">Pinned titles</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Rank Tier</span>
              <Award className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">Platinum I</p>
            <span className="text-[11px] text-white/40 mt-1 block">Web Arena Circuit</span>
          </div>
        </div>

        {/* Playable In-Browser Games Launcher */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-white">IN-BROWSER GAMES ARENA</h3>
              <p className="text-white/40 text-xs">Run immediately inside your browser without any install.</p>
            </div>
            <Link
              href="/games"
              className="text-xs text-violet-400 hover:text-violet-300 font-bold"
            >
              Browse All Games →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {playableGames.map((game) => {
              const personalBest = getLocalHighScore(game.slug);

              return (
                <div
                  key={game.slug}
                  className="group p-5 rounded-3xl border border-white/10 hover:border-violet-500/50 transition-all duration-300 flex flex-col justify-between"
                  style={{
                    background: 'linear-gradient(135deg, rgba(18,18,32,0.95), rgba(25,25,50,0.9))',
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl group-hover:scale-110 transition-transform">
                        {game.emoji}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/10 text-white/70">
                        {game.category}
                      </span>
                    </div>

                    <h4 className="text-xl font-black text-white mb-1 group-hover:text-violet-300 transition-colors">
                      {game.title}
                    </h4>
                    <p className="text-white/40 text-xs line-clamp-2 leading-relaxed mb-4">
                      {game.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="text-xs font-mono">
                      <span className="text-white/40 block text-[10px]">PERSONAL BEST</span>
                      <span className="text-amber-400 font-bold">{personalBest} pts</span>
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
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 flex items-center gap-1.5 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>LAUNCH</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Game Sessions History */}
        {recentSessions.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-violet-400" />
              <h3 className="text-lg font-black text-white">RECENT GAME SESSIONS</h3>
            </div>

            <div className="rounded-2xl border border-white/8 overflow-hidden bg-white/3">
              <div className="divide-y divide-white/5">
                {recentSessions.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-violet-600/20 text-violet-300 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <h5 className="font-bold text-white text-sm capitalize">
                          {s.gameSlug.replace('-', ' ')}
                        </h5>
                        <span className="text-[11px] text-white/40">
                          Duration: {s.durationSeconds}s • {new Date(s.completedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400 text-sm">{s.score} pts</span>
                        <span className="text-[10px] text-white/40 block">Final Result</span>
                      </div>

                      <Link
                        href={`/play/${s.gameSlug}`}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-600 text-white text-xs font-semibold transition-colors"
                      >
                        Replay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
