'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Coins,
  Users,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Bot,
  Eye,
  HandMetal,
  XCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getOrCreateTable,
  joinTableSeat,
  addAIBot,
  startNewRound,
  seePlayerCards,
  placeBet,
  foldPlayer,
  triggerShowdown,
  saveTableState,
} from '@/lib/teen-patti/table-manager';
import { TeenPattiTableState, TablePlayer } from '@/lib/teen-patti/types';
import { DealerAvatar } from '@/components/teen-patti/DealerAvatar';
import { CardView } from '@/components/teen-patti/CardView';
import { getBettingLimits, evaluateHand } from '@/lib/teen-patti/engine';
import { getPlayerWallet } from '@/lib/wallet/wallet-service';
import { gameAudio } from '@/lib/games/audio';

function TableContent() {
  const params = useParams();
  const router = useRouter();
  const tableId = params?.tableId as string;

  const { user, profile } = useAuth();
  const [table, setTable] = useState<TeenPattiTableState | null>(null);
  const [copied, setCopied] = useState(false);
  const [userChips, setUserChips] = useState(100000);
  const [raiseAmount, setRaiseAmount] = useState<number>(0);

  const currentUserId = user?.id || 'demo-player';
  const currentUsername = profile?.username || 'Player';
  const currentPlayerId = profile?.player_id || 'GV-849201';
  const currentAvatar = profile?.avatar_url || 'GV';

  // Load Table State & User Chips
  useEffect(() => {
    if (!tableId) return;

    getPlayerWallet(currentUserId).then((w) => setUserChips(w.balance));

    const t = getOrCreateTable(tableId);
    setTable(t);
  }, [tableId, currentUserId]);

  // Find seated player corresponding to current user
  const mySeatIndex = table?.players.findIndex((p) => p && p.userId === currentUserId) ?? -1;
  const myPlayer = mySeatIndex !== -1 && table ? table.players[mySeatIndex] : null;
  const isMyTurn = table?.status === 'active' && table?.currentTurnSeat === mySeatIndex;

  // Betting limits for current turn
  const isSeen = myPlayer?.state === 'seen';
  const currentStake = table?.currentStake || 1000;
  const limits = getBettingLimits(currentStake, isSeen);

  useEffect(() => {
    if (limits) {
      setRaiseAmount(limits.minBet);
    }
  }, [table?.currentStake, isSeen]);

  // AI Turn Auto-Player Simulator
  useEffect(() => {
    if (!table || table.status !== 'active') return;

    const currentSeat = table.currentTurnSeat;
    const activePlayer = table.players[currentSeat];

    if (activePlayer && activePlayer.isAI && activePlayer.state !== 'folded') {
      const timer = setTimeout(() => {
        // AI Decision Logic
        const remainingActive = table.players.filter(
          (p): p is TablePlayer => p !== null && p.state !== 'folded'
        );

        if (remainingActive.length === 2 && Math.random() < 0.35) {
          // AI triggers Showdown
          gameAudio.playClick();
          const updated = triggerShowdown(table, activePlayer.userId);
          setTable({ ...updated });
        } else if (Math.random() < 0.15 && activePlayer.state === 'seen') {
          // AI folds on weak chance
          gameAudio.playGameOver();
          const updated = foldPlayer(table, activePlayer.userId);
          setTable({ ...updated });
        } else {
          // AI plays Chaal / Blind
          gameAudio.playEat();
          const aiLimits = getBettingLimits(table.currentStake, activePlayer.state === 'seen');
          const updated = placeBet(table, activePlayer.userId, aiLimits.minBet);
          setTable({ ...updated });
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [table]);

  if (!table) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(table.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSitDown = (seatIdx: number) => {
    gameAudio.playClick();
    const updated = joinTableSeat(
      table,
      seatIdx,
      {
        id: currentUserId,
        username: currentUsername,
        playerId: currentPlayerId,
        avatarUrl: currentAvatar,
      },
      userChips
    );
    setTable({ ...updated });
  };

  const handleAddBot = () => {
    gameAudio.playClick();
    const updated = addAIBot(table);
    setTable({ ...updated });
  };

  const handleStartRound = () => {
    gameAudio.playLaser();
    const updated = startNewRound(table);
    setTable({ ...updated });
  };

  const handleSeeCards = () => {
    gameAudio.playBoost();
    const updated = seePlayerCards(table, currentUserId);
    setTable({ ...updated });
  };

  const handlePlaceBet = (amount: number) => {
    gameAudio.playEat();
    const updated = placeBet(table, currentUserId, amount);
    setTable({ ...updated });
  };

  const handleFold = () => {
    gameAudio.playGameOver();
    const updated = foldPlayer(table, currentUserId);
    setTable({ ...updated });
  };

  const handleShowdown = () => {
    gameAudio.playClick();
    const updated = triggerShowdown(table, currentUserId);
    setTable({ ...updated });
  };

  const activePlayersCount = table.players.filter(
    (p): p is TablePlayer => p !== null && p.state !== 'folded'
  ).length;

  return (
    <div className="min-h-screen bg-[#070712] text-white flex flex-col justify-between relative overflow-x-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-700/10 blur-[150px] pointer-events-none" />

      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/games/teen-patti/lobby"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave Table</span>
            </Link>

            <div>
              <h1 className="text-sm font-black text-white">{table.tableName}</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  Boot: {table.bootAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/40 font-mono">• Round #{table.roundCount}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Room Code Badge */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
              title="Click to copy room code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{table.roomCode}</span>
            </button>

            {/* User Chip Count Pill */}
            <Link
              href="/wallet"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-amber-400"
            >
              <span>🪙</span>
              <span>{userChips.toLocaleString()}</span>
            </Link>

            {/* Legal Non-Monetary Disclaimer Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] font-mono text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Virtual Chips Only • No Real Money Value</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Table Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 max-w-6xl mx-auto w-full relative">
        {/* The Oval Felt Gaming Table */}
        <div
          className="relative w-full aspect-[4/3] max-w-4xl max-h-[580px] rounded-[100px] sm:rounded-[180px] border-4 border-amber-500/40 shadow-2xl p-4 sm:p-8 flex flex-col items-center justify-between"
          style={{
            background: 'radial-gradient(ellipse at center, #063d27 0%, #032416 65%, #02140c 100%)',
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8), 0 25px 60px -15px rgba(0,0,0,0.9), 0 0 60px rgba(16,185,129,0.15)',
          }}
        >
          {/* Table Felt Subtle Inner Border Ring */}
          <div className="absolute inset-4 sm:inset-6 rounded-[80px] sm:rounded-[160px] border border-emerald-400/20 pointer-events-none" />

          {/* TOP CENTER: Female Virtual Dealer Aria */}
          <div className="relative z-20">
            <DealerAvatar
              dealer={table.dealer}
              onToggleSound={() => {
                const muted = !table.dealer.isMuted;
                setTable({ ...table, dealer: { ...table.dealer, isMuted: muted } });
                gameAudio.setMuted(muted);
              }}
              onToggleAnimations={() => {
                setTable({
                  ...table,
                  dealer: { ...table.dealer, animationsEnabled: !table.dealer.animationsEnabled },
                });
              }}
            />
          </div>

          {/* CENTER TABLE FELT: Pot Amount & Current Stakes */}
          <div className="flex flex-col items-center justify-center my-auto z-10 text-center">
            <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-emerald-300/70 mb-1">
              Main Pot
            </span>
            <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-black/60 border border-amber-400/40 backdrop-blur-md shadow-xl shadow-amber-500/10">
              <span className="text-xl sm:text-2xl">🪙</span>
              <span className="font-mono text-2xl sm:text-4xl font-black text-amber-400">
                {table.pot.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-white/40 font-mono mt-1.5">
              Current Stake: {table.currentStake.toLocaleString()} chips
            </span>
          </div>

          {/* 6 PLAYER SEATS AROUND THE TABLE */}
          {/* Top Left (Seat 0), Top Right (Seat 1) */}
          {/* Middle Left (Seat 5), Middle Right (Seat 2) */}
          {/* Bottom Left (Seat 4), Bottom Right (Seat 3) */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { idx: 0, pos: 'top-2 sm:top-4 left-4 sm:left-12' },
              { idx: 1, pos: 'top-2 sm:top-4 right-4 sm:right-12' },
              { idx: 5, pos: 'top-1/2 -translate-y-1/2 left-2 sm:left-6' },
              { idx: 2, pos: 'top-1/2 -translate-y-1/2 right-2 sm:right-6' },
              { idx: 4, pos: 'bottom-2 sm:bottom-4 left-8 sm:left-20' },
              { idx: 3, pos: 'bottom-2 sm:bottom-4 right-8 sm:right-20' },
            ].map(({ idx, pos }) => {
              const p = table.players[idx];
              const isTurn = table.status === 'active' && table.currentTurnSeat === idx;
              const isMe = p && p.userId === currentUserId;

              return (
                <div key={idx} className={`absolute ${pos} pointer-events-auto z-20`}>
                  {p ? (
                    /* Occupied Player Seat */
                    <div
                      className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 backdrop-blur-md ${
                        isTurn
                          ? 'ring-2 ring-amber-400 shadow-xl shadow-amber-500/30 scale-105 bg-black/80'
                          : p.state === 'folded'
                          ? 'opacity-40 bg-black/40'
                          : 'bg-black/60 border border-white/10'
                      }`}
                    >
                      {/* Avatar & Turn Glow */}
                      <div className="relative">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xs sm:text-sm text-white shadow-md">
                          {p.avatarUrl || 'GV'}
                        </div>
                        {isTurn && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>

                      {/* Username & Player ID */}
                      <span className="text-xs font-bold text-white max-w-[80px] sm:max-w-[100px] truncate mt-1">
                        {p.username} {isMe ? '(You)' : ''}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">
                        {p.chips.toLocaleString()}
                      </span>

                      {/* State Badge */}
                      <span
                        className={`text-[8px] sm:text-[9px] uppercase font-black px-2 py-0.5 rounded-full mt-1 ${
                          p.state === 'blind'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : p.state === 'seen'
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                            : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {p.state}
                      </span>

                      {/* 3 Player Cards */}
                      {p.cards && p.cards.length === 3 && (
                        <div className="flex items-center -space-x-4 mt-2">
                          {p.cards.map((c, cIdx) => (
                            <CardView
                              key={cIdx}
                              card={c}
                              isFaceDown={!isMe && table.status !== 'settled'}
                              size="sm"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Empty Seat */
                    <button
                      onClick={() => handleSitDown(idx)}
                      disabled={mySeatIndex !== -1}
                      className="px-3 py-2 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Users className="w-4 h-4" />
                      <span>Seat #{idx + 1}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Winner Announcement Overlay */}
        <AnimatePresence>
          {table.status === 'settled' && table.winnerResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-30 p-6 sm:p-8 rounded-3xl bg-black/90 border-2 border-amber-400 backdrop-blur-2xl text-center shadow-2xl max-w-sm w-full mx-4"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), 0 0 60px rgba(245,158,11,0.4)',
              }}
            >
              <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
              <span className="text-xs font-black uppercase text-amber-300 tracking-widest block mb-1">
                ROUND WINNER
              </span>
              <h2 className="text-2xl font-black text-white mb-1">
                {table.winnerResult.winnerName}
              </h2>
              <span className="text-xs text-violet-300 font-bold block mb-4">
                Won with: {table.winnerResult.handName}
              </span>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-6 font-mono">
                <span className="text-xs text-white/50 block">Pot Payout</span>
                <span className="text-2xl font-black text-amber-400">
                  +{table.winnerResult.potAmount.toLocaleString()} Chips
                </span>
              </div>

              <button
                onClick={handleStartRound}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
              >
                Deal Next Round
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BOTTOM ACTION CONTROLS HUD */}
      <footer className="sticky bottom-0 z-40 backdrop-blur-xl bg-black/80 border-t border-white/10 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {mySeatIndex === -1 ? (
            /* User Not Seated Notice */
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-white/60">
                You are currently spectating. Click any open seat on the table to join the action.
              </span>
              <button
                onClick={handleAddBot}
                className="px-4 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Add AI Bot</span>
              </button>
            </div>
          ) : table.status !== 'active' ? (
            /* Round Waiting State */
            <div className="w-full flex items-center justify-between gap-3">
              <span className="text-xs text-white/60 font-semibold">
                Waiting to deal next round. Seated: {table.players.filter((p) => p !== null).length}/6
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddBot}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>Add Bot</span>
                </button>
                <button
                  onClick={handleStartRound}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
                >
                  Deal Hand
                </button>
              </div>
            </div>
          ) : (
            /* Active Round Controls */
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left Side: See Cards Button */}
              <div className="flex items-center gap-2">
                {myPlayer?.state === 'blind' ? (
                  <button
                    onClick={handleSeeCards}
                    className="px-4 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>See Cards</span>
                  </button>
                ) : (
                  myPlayer?.cards && (
                    <div className="text-xs font-bold text-violet-300 font-mono">
                      Hand: {evaluateHand(myPlayer.cards).name}
                    </div>
                  )
                )}
              </div>

              {/* Right Side: Betting & Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Pack / Fold */}
                <button
                  onClick={handleFold}
                  disabled={!isMyTurn}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs uppercase cursor-pointer disabled:opacity-40"
                >
                  Pack (Fold)
                </button>

                {/* Showdown (Available when only 2 active players left) */}
                {activePlayersCount === 2 && (
                  <button
                    onClick={handleShowdown}
                    disabled={!isMyTurn}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-cyan-600/30 cursor-pointer disabled:opacity-40"
                  >
                    Show ({limits.minBet.toLocaleString()})
                  </button>
                )}

                {/* Call / Bet (Blind or Chaal) */}
                <button
                  onClick={() => handlePlaceBet(limits.minBet)}
                  disabled={!isMyTurn || (myPlayer?.chips || 0) < limits.minBet}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 cursor-pointer disabled:opacity-40"
                >
                  {limits.label} ({limits.minBet.toLocaleString()})
                </button>

                {/* Double / Raise */}
                <button
                  onClick={() => handlePlaceBet(limits.maxBet)}
                  disabled={!isMyTurn || (myPlayer?.chips || 0) < limits.maxBet}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase cursor-pointer disabled:opacity-40"
                >
                  Raise ({limits.maxBet.toLocaleString()})
                </button>
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function TeenPattiTablePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TableContent />
    </Suspense>
  );
}
