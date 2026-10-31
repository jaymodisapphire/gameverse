'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Users,
  Coins,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  Flame,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth/auth-context';
import { getPlayerWallet } from '@/lib/wallet/wallet-service';

interface TablePreview {
  id: string;
  roomCode: string;
  name: string;
  bootAmount: number;
  playerCount: number;
  maxPlayers: number;
  potEstimate: number;
  badge: string;
  accentColor: string;
}

const PUBLIC_TABLES: TablePreview[] = [
  {
    id: 'tp-novice-1',
    roomCode: 'TP-1001',
    name: 'Cyber Lounge',
    bootAmount: 1000,
    playerCount: 3,
    maxPlayers: 6,
    potEstimate: 8000,
    badge: 'Novice Friendly',
    accentColor: '#10b981',
  },
  {
    id: 'tp-pro-1',
    roomCode: 'TP-5001',
    name: 'Neon High-Rollers',
    bootAmount: 5000,
    playerCount: 4,
    maxPlayers: 6,
    potEstimate: 45000,
    badge: 'Most Popular',
    accentColor: '#8b5cf6',
  },
  {
    id: 'tp-master-1',
    roomCode: 'TP-2501',
    name: 'Valkyrie Arena',
    bootAmount: 25000,
    playerCount: 2,
    maxPlayers: 6,
    potEstimate: 160000,
    badge: 'High Stakes',
    accentColor: '#f59e0b',
  },
  {
    id: 'tp-legend-1',
    roomCode: 'TP-9901',
    name: 'Apex Cyber Syndicate',
    bootAmount: 100000,
    playerCount: 3,
    maxPlayers: 6,
    potEstimate: 850000,
    badge: 'VIP Elite',
    accentColor: '#f43f5e',
  },
];

export default function TeenPattiLobbyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [chips, setChips] = useState<number>(100000);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    getPlayerWallet(user?.id || 'demo-player').then((w) => setChips(w.balance));
  }, [user]);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCodeInput.trim().toUpperCase();
    if (!clean) return;

    if (!clean.startsWith('TP-') && clean.length !== 4 && clean.length !== 7) {
      setCodeError('Room code format: TP-XXXX or 4 characters');
      return;
    }

    const finalCode = clean.startsWith('TP-') ? clean : `TP-${clean}`;
    router.push(`/games/teen-patti/join/${finalCode}`);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      {/* Background Ambience */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[350px] rounded-full bg-emerald-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[400px] rounded-full bg-violet-600/10 blur-[140px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10">
        <Link
          href="/games/teen-patti"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Teen Patti Hub</span>
        </Link>

        {/* Header with Player Chips Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multiplayer Room Browser</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              TEEN PATTI TABLES
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Select an open public table or join a private room with friends.
            </p>
          </div>

          {/* User Chip Counter & Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="p-3 px-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base">
                🪙
              </div>
              <div>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">
                  Your Chips
                </span>
                <span className="font-mono font-black text-white text-base">
                  {chips.toLocaleString('en-US')}
                </span>
              </div>
              <Link
                href="/wallet/request-chips"
                className="ml-2 text-xs text-amber-400 hover:text-amber-300 font-bold"
              >
                + Get More
              </Link>
            </div>

            <Link
              href="/games/teen-patti/create"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Room</span>
            </Link>
          </div>
        </div>

        {/* Private Code Form Banner */}
        <div
          className="p-6 rounded-3xl border border-white/10 mb-10 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(20,18,36,0.9), rgba(28,24,50,0.85))',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Join Private Invitation Table</h3>
              <p className="text-xs text-white/50">Have a 4 or 6 character room code from a friend?</p>
            </div>
          </div>

          <form onSubmit={handleJoinByCode} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => {
                setRoomCodeInput(e.target.value);
                setCodeError(null);
              }}
              placeholder="e.g. TP-8492"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs font-mono uppercase tracking-wider outline-none focus:border-violet-500 w-full md:w-48"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
            >
              Join Room
            </button>
          </form>
        </div>

        {codeError && (
          <p className="text-xs text-rose-400 -mt-6 mb-6 font-semibold">{codeError}</p>
        )}

        {/* Public Tables List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PUBLIC_TABLES.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-3xl border border-white/10 hover:border-violet-500/50 transition-all flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, rgba(16,16,28,0.95), rgba(22,20,38,0.9))',
                boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${t.accentColor}20`, color: t.accentColor }}
                  >
                    {t.badge}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-white/60 font-mono">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t.playerCount}/{t.maxPlayers} Seated</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white mb-1">{t.name}</h3>
                <span className="text-xs text-violet-400 font-mono block mb-4">Room {t.roomCode}</span>

                <div className="space-y-2 p-3.5 rounded-2xl bg-black/40 border border-white/5 mb-6 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-white/50">Boot Stake:</span>
                    <span className="text-amber-400 font-bold">{t.bootAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Est. Round Pot:</span>
                    <span className="text-emerald-400 font-bold">{t.potEstimate.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/games/teen-patti/table/${t.id}`}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <span>Take Seat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
