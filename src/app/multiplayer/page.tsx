'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Bot,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Gamepad2,
  Trophy,
  Flame,
  Radio,
  Search,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { parseGameFromRoomCode } from '@/lib/multiplayer/room-manager';

interface MultiplayerGame {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  playerRange: string;
  hasCustomRooms: boolean;
  hasBots: boolean;
  accentColor: string;
  badge: string;
  emoji: string;
  tags: string[];
}

const MULTIPLAYER_GAMES: MultiplayerGame[] = [
  {
    id: 'teen-patti',
    title: 'Teen Patti Royale',
    subtitle: '3D Virtual Chip Casino',
    description: 'Authentic 3-card Indian Poker. Play with up to 6 players or AI bots, hosted by AI Dealer Aria with live chaal, blind, sideshows, and private tables.',
    route: '/games/teen-patti',
    playerRange: '2 - 6 Players',
    hasCustomRooms: true,
    hasBots: true,
    accentColor: '#f59e0b',
    badge: '3D TABLE',
    emoji: '🃏',
    tags: ['Cards', 'Custom Rooms', 'AI Dealer Aria', 'Virtual Chips'],
  },
  {
    id: 'ludo',
    title: 'Cyber Ludo Arena',
    subtitle: '4-Player Quantum Circuit',
    description: 'Classic board strategy in a cyber arena. Deploy pawns on a 6, hunt opponents across the quantum ring, and race your squad safely to the core.',
    route: '/games/ludo',
    playerRange: '2 - 4 Players',
    hasCustomRooms: true,
    hasBots: true,
    accentColor: '#f43f5e',
    badge: 'NEW ONLINE',
    emoji: '🎲',
    tags: ['Board', 'Custom Rooms', 'Play with Bot', '2-4 Players'],
  },
  {
    id: 'connect-four',
    title: 'Cyber Connect Four',
    subtitle: '7x6 Gravity Grid Matrix',
    description: 'The ultimate vertical tactical duel. Drop quantum discs into 7 columns to align 4 in a row while blocking your opponent’s tactical advances.',
    route: '/games/connect-four',
    playerRange: '2 Players',
    hasCustomRooms: true,
    hasBots: true,
    accentColor: '#06b6d4',
    badge: 'BRAND NEW',
    emoji: '🔴',
    tags: ['Strategy', 'Custom Rooms', 'AI Sentinel', 'PvP'],
  },
  {
    id: 'tic-tac-toe',
    title: 'Neon Tic Tac Toe',
    subtitle: 'High-Speed Grid Duel',
    description: 'The classic X vs O battle re-engineered with cyber glow aesthetics, unbeatable Minimax AI, live peer-to-peer room sync, and cyber taunts.',
    route: '/games/tic-tac-toe',
    playerRange: '2 Players',
    hasCustomRooms: true,
    hasBots: true,
    accentColor: '#ec4899',
    badge: 'INSTANT PVP',
    emoji: '❌',
    tags: ['Puzzle', 'Custom Rooms', 'Minimax AI', '1v1'],
  },
];

export default function MultiplayerHubPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'custom' | 'bot'>('all');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setErrorMsg('Please enter a 6-digit room code');
      return;
    }

    const game = parseGameFromRoomCode(code);
    if (!game) {
      setErrorMsg('Invalid room code format. Use TP-..., LUDO-..., TTT-..., or C4-...');
      return;
    }

    if (game === 'TP') {
      router.push(`/games/teen-patti/table/${code}`);
    } else if (game === 'LUDO') {
      router.push(`/games/ludo?room=${code}`);
    } else if (game === 'TTT') {
      router.push(`/games/tic-tac-toe?room=${code}`);
    } else if (game === 'C4') {
      router.push(`/games/connect-four?room=${code}`);
    }
  };

  const filteredGames = MULTIPLAYER_GAMES.filter((g) => {
    if (filter === 'custom') return g.hasCustomRooms;
    if (filter === 'bot') return g.hasBots;
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden flex flex-col justify-between">
      <Navbar />

      {/* Cyber Ambient Lighting */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[350px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[400px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10 w-full">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Multiplayer & Custom Rooms Command Center</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-3">
            ONLINE{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
              MULTIPLAYER
            </span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base leading-relaxed">
            Create private custom rooms with 6-digit codes, invite your friends, or test your strategies against intelligent AI bots.
          </p>
        </div>

        {/* Universal Room Code Joiner Box */}
        <div className="max-w-2xl mx-auto mb-12 p-6 rounded-3xl bg-gray-950/80 border-2 border-cyan-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Join Any Custom Room</h2>
              <p className="text-xs text-white/50">Enter code to jump directly into your friend&apos;s active game match</p>
            </div>
          </div>

          <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="e.g. LUDO-482910, TTT-918231, C4-129481, TP-1001"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm font-mono uppercase outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Join Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {errorMsg && (
            <p className="text-rose-400 text-xs font-semibold mt-2.5 ml-1">
              ⚠️ {errorMsg}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/5 text-[11px] text-white/40">
            <span>Supported Prefixes:</span>
            <span className="font-mono text-cyan-300">LUDO-XXXXXX</span>
            <span className="font-mono text-rose-300">TTT-XXXXXX</span>
            <span className="font-mono text-cyan-300">C4-XXXXXX</span>
            <span className="font-mono text-amber-300">TP-XXXXXX</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            All Multiplayer ({MULTIPLAYER_GAMES.length})
          </button>
          <button
            onClick={() => setFilter('custom')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'custom'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            Custom Rooms (4)
          </button>
          <button
            onClick={() => setFilter('bot')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'bot'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            Play with Bot (4)
          </button>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGames.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ y: -4 }}
              className="p-6 rounded-3xl bg-gray-950/70 border border-white/10 hover:border-white/20 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-3 rounded-2xl bg-white/5 border border-white/10">
                      {game.emoji}
                    </span>
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-xs text-white/40">{game.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border"
                    style={{
                      borderColor: `${game.accentColor}50`,
                      backgroundColor: `${game.accentColor}15`,
                      color: game.accentColor,
                    }}
                  >
                    {game.badge}
                  </span>
                </div>

                <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-4">
                  {game.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {game.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-xl bg-white/5 text-[11px] font-medium text-white/60 border border-white/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <Link
                  href={game.route}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 group-hover:bg-cyan-500 group-hover:text-black"
                >
                  <span>Enter Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-xs font-mono">
                  {game.playerRange}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
