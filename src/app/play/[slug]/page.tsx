'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Trophy,
  Flame,
  Info,
  Shield,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Crosshair,
  Heart,
} from 'lucide-react';
import { getGameBySlug, createGameEngine, CATALOG_GAMES } from '@/lib/games/registry';
import { GameEngine } from '@/lib/games/types';
import { recordGameSession, getLocalHighScore, toggleFavoriteGame, getFavoriteGames } from '@/lib/games/sessions';
import { useAuth } from '@/lib/auth/auth-context';

function GameLauncherContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const game = getGameBySlug(slug);

  const { user } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [gameOverStats, setGameOverStats] = useState<{ score: number; duration: number } | null>(null);

  // Initialize high score and favorites
  useEffect(() => {
    if (slug === 'teen-patti') {
      router.replace('/games/teen-patti');
      return;
    }
    if (!game) return;
    const initialHigh = getLocalHighScore(game.slug);
    setHighScore(initialHigh);

    const favs = getFavoriteGames();
    setIsFavorite(favs.includes(game.slug));

    // Simulated quick loading buffer
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [game]);

  // Initialize Game Engine on Canvas
  useEffect(() => {
    if (isLoading || !canvasRef.current || !game) return;

    const engine = createGameEngine(game.slug);
    if (!engine) return;

    engineRef.current = engine;
    engine.init(canvasRef.current, {
      soundEnabled: !isMuted,
      onScoreUpdate: (newScore) => {
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
        }
      },
      onGameOver: async (finalScore, duration) => {
        setIsGameOver(true);
        setIsPlaying(false);
        setGameOverStats({ score: finalScore, duration });

        const result = await recordGameSession(game.slug, finalScore, duration, user?.id);
        if (result.isNewHighScore) {
          setHighScore(finalScore);
        }
      },
      onStateChange: (state) => {
        if (state === 'running') {
          setIsPlaying(true);
          setIsPaused(false);
        } else if (state === 'paused') {
          setIsPaused(true);
        } else if (state === 'gameover') {
          setIsGameOver(true);
          setIsPlaying(false);
        }
      },
    });

    // Auto-start game on mount
    engine.start();
    setIsPlaying(true);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [isLoading, game]);

  const togglePause = () => {
    if (!engineRef.current || isGameOver) return;
    if (isPaused) {
      engineRef.current.resume();
      setIsPaused(false);
    } else {
      engineRef.current.pause();
      setIsPaused(true);
    }
  };

  const restartGame = () => {
    if (!engineRef.current) return;
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setGameOverStats(null);
    engineRef.current.restart();
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (engineRef.current) {
      engineRef.current.setSoundEnabled(!next);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleFavoriteToggle = () => {
    if (!game) return;
    const isFav = toggleFavoriteGame(game.slug);
    setIsFavorite(isFav);
  };

  // Mobile virtual input buttons
  const sendInput = (action: string, active: boolean) => {
    if (engineRef.current) {
      engineRef.current.handleInput(action, active);
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <Gamepad2 className="w-16 h-16 text-violet-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-black mb-2">Game Not Found</h1>
        <p className="text-white/50 text-sm max-w-md mb-6">
          The requested in-browser game module could not be located in the GameVerse registry.
        </p>
        <Link
          href="/games"
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-sm text-white transition-colors"
        >
          Explore All Games
        </Link>
      </div>
    );
  }

  const relatedGames = CATALOG_GAMES.filter((g) => g.slug !== game.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-x-hidden">
      {/* Background Ambience */}
      <div
        className="fixed top-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ backgroundColor: game.accentColor }}
      />
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-white/10 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/games"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-lg">{game.emoji}</span>
              <h1 className="text-sm font-black text-white tracking-wide">{game.title}</h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {game.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-white/40">SCORE</span>
              <span className="text-white font-bold text-base px-2 py-0.5 rounded bg-white/5 border border-white/10">
                {score}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>BEST: {highScore}</span>
            </div>
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-xl border transition-colors ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Launcher Stage */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div
          ref={containerRef}
          className="relative rounded-3xl border border-white/15 overflow-hidden backdrop-blur-2xl shadow-2xl flex flex-col items-center bg-[#070712]"
          style={{
            boxShadow: `0 20px 60px -15px rgba(0,0,0,0.8), 0 0 50px ${game.accentColor}25`,
          }}
        >
          {/* Top Stage Bar */}
          <div className="w-full px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 font-bold tracking-wider uppercase text-[11px]">
                LIVE CANVAS RUNTIME
              </span>
            </div>

            {/* In-Game Action Bar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={togglePause}
                disabled={isGameOver}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors disabled:opacity-40"
                title={isPaused ? 'Resume Game' : 'Pause Game'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={restartGame}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors"
                title="Restart Game"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={toggleSound}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative w-full flex items-center justify-center p-3 sm:p-6 min-h-[380px] sm:min-h-[500px]">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 animate-bounce"
                  style={{ backgroundColor: `${game.accentColor}25`, border: `1px solid ${game.accentColor}50` }}
                >
                  {game.emoji}
                </div>
                <h3 className="text-lg font-black text-white mb-1">INITIALIZING {game.title.toUpperCase()}</h3>
                <p className="text-white/40 text-xs">Calibrating browser canvas & audio synthesizers...</p>
              </div>
            )}

            {/* Paused Overlay */}
            {isPaused && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <Pause className="w-12 h-12 text-white/60 mb-3" />
                <h3 className="text-2xl font-black text-white mb-2">GAME PAUSED</h3>
                <button
                  onClick={togglePause}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-sm text-white transition-colors"
                >
                  Resume Match
                </button>
              </div>
            )}

            {/* Genuine Playable Canvas Element */}
            <canvas
              ref={canvasRef}
              className="w-full max-w-[480px] aspect-square rounded-2xl border border-white/10 shadow-2xl bg-[#06060c] touch-none cursor-crosshair"
            />
          </div>

          {/* On-Screen Mobile Touch Controls HUD */}
          <div className="w-full px-4 py-3 border-t border-white/10 bg-black/50 flex flex-col items-center gap-2">
            <span className="text-[10px] text-white/30 uppercase font-bold tracking-wider">
              Touch & Keyboard Controls
            </span>

            {game.slug === 'neon-snake' && (
              <div className="grid grid-cols-3 gap-2 w-48 max-w-full">
                <div />
                <button
                  aria-label="Move Up"
                  onPointerDown={() => sendInput('up', true)}
                  className="p-3 rounded-xl bg-white/10 active:bg-emerald-500 flex items-center justify-center text-white cursor-pointer"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                <div />
                <button
                  aria-label="Move Left"
                  onPointerDown={() => sendInput('left', true)}
                  className="p-3 rounded-xl bg-white/10 active:bg-emerald-500 flex items-center justify-center text-white cursor-pointer"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <button
                  aria-label="Move Down"
                  onPointerDown={() => sendInput('down', true)}
                  className="p-3 rounded-xl bg-white/10 active:bg-emerald-500 flex items-center justify-center text-white cursor-pointer"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <button
                  aria-label="Move Right"
                  onPointerDown={() => sendInput('right', true)}
                  className="p-3 rounded-xl bg-white/10 active:bg-emerald-500 flex items-center justify-center text-white cursor-pointer"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}

            {game.slug === 'space-defender' && (
              <div className="flex items-center justify-between w-full max-w-xs gap-4">
                <div className="flex gap-2">
                  <button
                    aria-label="Steer Left"
                    onPointerDown={() => sendInput('left', true)}
                    onPointerUp={() => sendInput('left', false)}
                    className="p-3.5 rounded-xl bg-white/10 active:bg-violet-600 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    aria-label="Steer Right"
                    onPointerDown={() => sendInput('right', true)}
                    onPointerUp={() => sendInput('right', false)}
                    className="p-3.5 rounded-xl bg-white/10 active:bg-violet-600 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </div>
                <button
                  aria-label="Fire Plasma"
                  onPointerDown={() => sendInput('shoot', true)}
                  onPointerUp={() => sendInput('shoot', false)}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-violet-600/30 cursor-pointer"
                >
                  <Crosshair className="w-4 h-4" />
                  Shoot
                </button>
              </div>
            )}

            {game.slug === 'neon-racer' && (
              <div className="flex items-center justify-between w-full max-w-xs gap-4">
                <div className="flex gap-2">
                  <button
                    aria-label="Steer Left"
                    onPointerDown={() => sendInput('left', true)}
                    onPointerUp={() => sendInput('left', false)}
                    className="p-3.5 rounded-xl bg-white/10 active:bg-cyan-500 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    aria-label="Steer Right"
                    onPointerDown={() => sendInput('right', true)}
                    onPointerUp={() => sendInput('right', false)}
                    className="p-3.5 rounded-xl bg-white/10 active:bg-cyan-500 flex items-center justify-center text-white cursor-pointer"
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </div>
                <button
                  aria-label="Nitro Boost"
                  onPointerDown={() => sendInput('boost', true)}
                  onPointerUp={() => sendInput('boost', false)}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-bold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  Boost
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Game Details & Instructions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2 p-6 rounded-3xl bg-white/3 border border-white/8">
            <h2 className="text-xl font-black text-white mb-2">ABOUT {game.title.toUpperCase()}</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">{game.description}</p>

            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> How to Play
            </h3>
            <p className="text-white/80 text-sm leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
              {game.instructions}
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/3 border border-white/8 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Session Record
              </h3>

              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-xl bg-white/5 flex items-center justify-between">
                  <span className="text-xs text-white/60">Personal Best</span>
                  <span className="text-amber-400 font-bold font-mono text-base">{highScore} pts</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 flex items-center justify-between">
                  <span className="text-xs text-white/60">Current Session</span>
                  <span className="text-white font-bold font-mono text-base">{score} pts</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 flex items-center justify-between">
                  <span className="text-xs text-white/60">Category</span>
                  <span className="text-violet-300 font-bold text-xs uppercase">{game.category}</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 text-center transition-colors block"
            >
              View Player Stats
            </Link>
          </div>
        </div>

        {/* Related Games Carousel */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-white tracking-wide">MORE GAMES YOU MIGHT LIKE</h3>
            <Link href="/games" className="text-xs text-violet-400 hover:text-violet-300 font-bold">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedGames.map((rg) => (
              <Link
                key={rg.slug}
                href={`/play/${rg.slug}`}
                className="group p-4 rounded-2xl border border-white/8 hover:border-violet-500/40 bg-white/3 hover:bg-white/5 transition-all duration-300 flex items-center gap-3.5"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${rg.accentColor}20`, border: `1px solid ${rg.accentColor}40` }}
                >
                  {rg.emoji}
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm truncate group-hover:text-violet-300 transition-colors">
                    {rg.title}
                  </h4>
                  <p className="text-white/40 text-xs truncate capitalize">{rg.category} Arena</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GameLauncherPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/50 font-mono">Calibrating Game Engine...</p>
          </div>
        </div>
      }
    >
      <GameLauncherContent />
    </Suspense>
  );
}
