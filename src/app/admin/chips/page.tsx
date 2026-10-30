'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Coins,
  PlusCircle,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth/auth-context';
import { adminSearchPlayers, adminGrantChips } from '@/lib/wallet/wallet-service';
import { AdminPlayerView } from '@/lib/wallet/types';

export default function AdminChipsPage() {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<AdminPlayerView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Grant Modal state
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayerView | null>(null);
  const [grantAmount, setGrantAmount] = useState<number>(50000);
  const [grantReason, setGrantReason] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPlayers = async (q: string = '') => {
    setIsLoading(true);
    const results = await adminSearchPlayers(q);
    setPlayers(results);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPlayers(searchQuery);
  };

  const handleExecuteGrant = async () => {
    if (!selectedPlayer) return;
    setIsSubmitting(true);
    setFeedback(null);

    const adminId = user?.id || 'admin-root';
    const res = await adminGrantChips(adminId, selectedPlayer.userId, grantAmount, grantReason);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Successfully credited ${grantAmount.toLocaleString()} virtual chips to ${selectedPlayer.username}! New balance: ${res.newBalance?.toLocaleString() || (selectedPlayer.balance + grantAmount).toLocaleString()} chips.`,
      });
      // Refresh list
      loadPlayers(searchQuery);
      setTimeout(() => {
        setSelectedPlayer(null);
        setIsConfirming(false);
        setGrantReason('');
      }, 2500);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to execute chip grant.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              GRANT VIRTUAL CHIPS
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Search online players, friends, and accounts to grant virtual chips with mandatory audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/chip-requests"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Review Requests Queue</span>
            </Link>
          </div>
        </div>

        {/* Global Alert / Feedback */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, player ID (GV-XXXXXX), or email..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-violet-500 text-white placeholder-white/30 text-sm outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Players List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((p) => (
            <div
              key={p.userId}
              className="p-5 rounded-3xl bg-white/3 hover:bg-white/5 border border-white/8 transition-all flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, rgba(16,16,28,0.9), rgba(22,22,40,0.85))',
              }}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                      {p.avatarUrl || 'GV'}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">{p.username}</h3>
                      <span className="text-xs text-violet-400 font-mono">{p.playerId}</span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 font-bold uppercase font-mono">
                    Lv.{p.level}
                  </span>
                </div>

                {p.email && <p className="text-xs text-white/40 mb-3 truncate">{p.email}</p>}

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between mb-4">
                  <span className="text-xs text-white/60">Current Balance:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {p.balance.toLocaleString()} Chips
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlayer(p);
                  setIsConfirming(false);
                  setGrantAmount(50000);
                  setGrantReason('');
                  setFeedback(null);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Grant Chips</span>
              </button>
            </div>
          ))}
        </div>

        {/* Modal: Grant Chips Confirmation Dialog */}
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div
              className="max-w-md w-full rounded-3xl border border-white/10 p-6 sm:p-8 relative bg-[#0f0e1c] shadow-2xl"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 50px rgba(245,158,11,0.2)',
              }}
            >
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Step 1 of 2: Adjustment Parameters
                </span>
                <h2 className="text-xl font-black text-white">
                  Grant Chips to {selectedPlayer.username}
                </h2>
                <span className="text-xs text-white/40 font-mono">{selectedPlayer.playerId}</span>
              </div>

              {!isConfirming ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                      Amount to Credit
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[25000, 50000, 100000, 500000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setGrantAmount(amt)}
                          className={`py-2 rounded-xl text-xs font-bold cursor-pointer ${
                            grantAmount === amt
                              ? 'bg-amber-500 text-black'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          +{amt >= 1000 ? `${amt / 1000}K` : amt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={10000000}
                      value={grantAmount}
                      onChange={(e) => setGrantAmount(Number(e.target.value))}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-base outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                      Audit Reason / Note (Mandatory)
                    </label>
                    <input
                      type="text"
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      placeholder="e.g. VIP Member Bonus / Tournament Compensation"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-violet-500 placeholder-white/30"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-white/60 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Current Balance:</span>
                      <span className="text-white">{selectedPlayer.balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Adding:</span>
                      <span>+{grantAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-1 text-emerald-400 font-black">
                      <span>New Balance:</span>
                      <span>{(selectedPlayer.balance + grantAmount).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (grantAmount <= 0) return;
                      setIsConfirming(true);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Confirmation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Step 2: Final Confirmation Screen */
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <p className="font-bold mb-1">Please confirm this irreversible grant:</p>
                    <p>
                      You are crediting <strong>{grantAmount.toLocaleString()} virtual chips</strong> to account{' '}
                      <strong>{selectedPlayer.username}</strong> ({selectedPlayer.playerId}).
                    </p>
                    <p className="mt-2 text-white/60">
                      Reason: &ldquo;{grantReason || 'Admin grant'}&rdquo;
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsConfirming(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleExecuteGrant}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Commiting...' : 'Confirm & Commit'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
