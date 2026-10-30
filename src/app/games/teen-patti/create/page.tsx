'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  ArrowLeft,
  Coins,
  Users,
  Shield,
  Sparkles,
  Lock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth/auth-context';
import { createPrivateTable } from '@/lib/teen-patti/table-manager';

const BOOT_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000];

export default function CreateTablePage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [tableName, setTableName] = useState('Cyber VIP Suite');
  const [bootAmount, setBootAmount] = useState(5000);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const host = {
      id: user?.id || 'demo-host',
      username: profile?.username || 'HostPlayer',
      playerId: profile?.player_id || 'GV-849201',
      avatarUrl: profile?.avatar_url || 'GV',
    };

    const newTable = createPrivateTable(tableName, bootAmount, host);
    router.push(`/games/teen-patti/table/${newTable.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10">
        <Link
          href="/games/teen-patti/lobby"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Lobby</span>
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5 text-violet-400" />
            <span>Private Suite</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            CREATE PRIVATE ROOM
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Create an invite-only Teen Patti room. You will receive a unique room code to invite friends.
          </p>
        </div>

        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl relative"
          style={{
            background: 'linear-gradient(135deg, rgba(20,18,36,0.95), rgba(28,24,50,0.9))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7)',
          }}
        >
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Table Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Room / Table Name
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                maxLength={30}
                required
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-violet-500"
              />
            </div>

            {/* Boot Amount Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Boot Amount (Per Hand)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BOOT_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBootAmount(amt)}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      bootAmount === amt
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {amt >= 1000 ? `${amt / 1000}K` : amt} Chips
                  </button>
                ))}
              </div>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Max Players (2 to 6)
              </label>
              <div className="flex gap-2">
                {[2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      maxPlayers === num
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {num} Seats
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isCreating ? 'Launching Room...' : 'Launch Table & Get Code'}</span>
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
