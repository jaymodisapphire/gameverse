'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Coins,
  ArrowUpRight,
  Send,
  History,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Gamepad2,
  RefreshCw,
  PlusCircle,
  FileText,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth/auth-context';
import { getPlayerWallet, getTransactionHistory } from '@/lib/wallet/wallet-service';
import { PlayerWallet, ChipTransaction } from '@/lib/wallet/types';

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<PlayerWallet | null>(null);
  const [transactions, setTransactions] = useState<ChipTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const userId = user?.id || 'demo-player';

  const loadWalletData = async () => {
    setIsLoading(true);
    const w = await getPlayerWallet(userId);
    setWallet(w);
    const tx = await getTransactionHistory(userId);
    setTransactions(tx);
    setIsLoading(false);
  };

  useEffect(() => {
    loadWalletData();
  }, [userId]);

  const balance = wallet?.balance ?? 100000;

  const filteredTx = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.transactionType === filterType;
  });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      {/* Background Ambience */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[350px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[400px] rounded-full bg-amber-600/10 blur-[140px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10">
        {/* Header Breadcrumb / Notice */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Virtual Chip Wallet</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              PLAYER CHIP VAULT
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Manage your free virtual chips for Teen Patti and high-stakes games.
            </p>
          </div>

          <button
            onClick={loadWalletData}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Balance</span>
          </button>
        </div>

        {/* Balance Hero Card */}
        <div
          className="rounded-3xl border border-amber-500/30 p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden mb-10"
          style={{
            background: 'linear-gradient(135deg, rgba(20,16,36,0.95), rgba(30,20,50,0.9))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 50px rgba(245,158,11,0.15)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-violet-500 to-indigo-500" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Gold Chip Stack Emblem */}
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30 border-2 border-amber-300/60 flex-shrink-0">
                🪙
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300/80">
                  Total Virtual Chip Balance
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-amber-400 font-bold text-sm uppercase">CHIPS</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Includes 100,000 Free Welcome Chips</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Link
                href="/games/teen-patti"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Play Teen Patti</span>
              </Link>

              <Link
                href="/wallet/request-chips"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Request Chips</span>
              </Link>

              <Link
                href="/wallet/requests"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 font-bold text-xs transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>My Requests</span>
              </Link>
            </div>
          </div>

          {/* Legal / Virtual Chips Disclaimer Alert */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-2.5 text-xs text-white/50 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-white/80">Virtual Chips Notice: </strong>
              GAMEVERSE virtual chips are purely for gameplay entertainment, simulation, and skill training.
              They are not purchasable, redeemable, transferable for cash, or convertible into real-world currency.
            </p>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-violet-400" />
              <h2 className="text-xl font-black text-white tracking-wide">
                TRANSACTION LEDGER
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { label: 'All', value: 'all' },
                { label: 'Starting Grant', value: 'starting_grant' },
                { label: 'Admin Grants', value: 'admin_grant' },
                { label: 'Approved Requests', value: 'approved_request' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    filterType === f.value
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          {filteredTx.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white/3 border border-white/8">
              <Coins className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/60 font-bold text-sm">No Transactions Found</p>
              <p className="text-white/30 text-xs mt-1">
                Your wallet activity and chip adjustments will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTx.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl bg-white/3 hover:bg-white/5 border border-white/8 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                          isCredit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white capitalize">
                            {tx.transactionType.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 font-mono">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">{tx.reason || 'Virtual chip adjustment'}</p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono">
                      <div
                        className={`font-black text-base ${
                          isCredit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isCredit ? '+' : ''}{tx.amount.toLocaleString()} Chips
                      </div>
                      <span className="text-[11px] text-white/40">
                        Balance after: {tx.balanceAfter.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
