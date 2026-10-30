'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Trophy,
  Bot,
  Eye,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Flame,
  Smile,
  Sparkles,
  Coins,
  Send,
  X,
  PlusCircle,
  CheckCircle2,
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
  requestSideShow,
  getPreviousActivePlayer,
  saveTableState,
} from '@/lib/teen-patti/table-manager';
import { TeenPattiTableState, TablePlayer, Card } from '@/lib/teen-patti/types';
import { DealerAvatar } from '@/components/teen-patti/DealerAvatar';
import { CardView } from '@/components/teen-patti/CardView';
import { ChipStack3D } from '@/components/teen-patti/ChipStack3D';
import { getBettingLimits, evaluateHand } from '@/lib/teen-patti/engine';
import { getPlayerWallet, submitChipRequest } from '@/lib/wallet/wallet-service';
import { gameAudio } from '@/lib/games/audio';

interface FloatingEmote {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

const CHIP_PRESETS = [10000, 25000, 50000, 100000, 250000];

function TableContent() {
  const params = useParams();
  const router = useRouter();
  const tableId = params?.tableId as string;

  const { user, profile } = useAuth();
  const [table, setTable] = useState<TeenPattiTableState | null>(null);
  const [copied, setCopied] = useState(false);
  const [userChips, setUserChips] = useState(100000);
  const [raiseAmount, setRaiseAmount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [emotes, setEmotes] = useState<FloatingEmote[]>([]);

  // In-Game Chip Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState<number>(50000);
  const [requestMessage, setRequestMessage] = useState('Need chips for Teen Patti');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestStatusMsg, setRequestStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Instant Approval Banner State
  const [approvedNotice, setApprovedNotice] = useState<string | null>(null);

  const currentUserId = user?.id || 'demo-player';
  const currentUsername = profile?.username || 'Player';
  const currentPlayerId = profile?.player_id || 'GV-849201';
  const currentAvatar = profile?.avatar_url || '👑';

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

  // Real-Time Instant Auto-Credit Sync (Every 1.5 seconds)
  // When Admin approves request, wallet balance increases -> instantly adds chips to table & continues game!
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(async () => {
      try {
        const w = await getPlayerWallet(currentUserId);
        setUserChips((prev) => {
          if (w.balance > prev) {
            const diff = w.balance - prev;
            gameAudio.playBoost();

            // Seamlessly credit chips directly to player's in-game seat stack!
            setTable((currentTable) => {
              if (!currentTable) return currentTable;
              const seatIdx = currentTable.players.findIndex((p) => p && p.userId === currentUserId);
              if (seatIdx !== -1 && currentTable.players[seatIdx]) {
                const updated = {
                  ...currentTable,
                  players: currentTable.players.map((p, i) =>
                    i === seatIdx && p ? { ...p, chips: p.chips + diff } : p
                  ),
                };
                saveTableState(updated);
                return updated;
              }
              return currentTable;
            });

            // Show celebratory banner
            setApprovedNotice(`🎉 Admin approved your request! +${diff.toLocaleString()} chips added to your table!`);
            setTimeout(() => setApprovedNotice(null), 6000);
          }
          return w.balance;
        });
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [currentUserId]);

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
        const remainingActive = table.players.filter(
          (p): p is TablePlayer => p !== null && p.state !== 'folded'
        );

        if (remainingActive.length === 2 && Math.random() < 0.35) {
          gameAudio.playClick();
          const updated = triggerShowdown(table, activePlayer.userId);
          setTable({ ...updated });
        } else if (Math.random() < 0.15 && activePlayer.state === 'seen') {
          gameAudio.playGameOver();
          const updated = foldPlayer(table, activePlayer.userId);
          setTable({ ...updated });
        } else {
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
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
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

  const handleSideShow = () => {
    gameAudio.playClick();
    const updated = requestSideShow(table, currentUserId);
    setTable({ ...updated });
  };

  // Submit in-game chip request without leaving table!
  const handleSubmitInGameRequest = async () => {
    if (requestAmount <= 0) return;
    setIsSubmittingRequest(true);
    setRequestStatusMsg(null);

    const res = await submitChipRequest(
      currentUserId,
      currentUsername,
      requestAmount,
      requestMessage
    );

    setIsSubmittingRequest(false);

    if (res.success) {
      setRequestStatusMsg({
        type: 'success',
        text: `Request for ${requestAmount.toLocaleString()} chips sent to Admin! Waiting for approval...`,
      });
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestStatusMsg(null);
      }, 2500);
    } else {
      setRequestStatusMsg({
        type: 'error',
        text: res.error || 'Failed to submit request. Please try again.',
      });
    }
  };

  const triggerEmote = (emoji: string) => {
    gameAudio.playClick();
    const newEmote: FloatingEmote = {
      id: Date.now(),
      emoji,
      x: 35 + Math.random() * 30,
      y: 60 + Math.random() * 20,
    };
    setEmotes((prev) => [...prev.slice(-6), newEmote]);
    setTimeout(() => {
      setEmotes((prev) => prev.filter((e) => e.id !== newEmote.id));
    }, 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activePlayersCount = table.players.filter(
    (p): p is TablePlayer => p !== null && p.state !== 'folded'
  ).length;

  const prevPlayer = mySeatIndex !== -1 && table ? getPreviousActivePlayer(table, mySeatIndex) : null;
  const canSideShow =
    activePlayersCount > 2 &&
    isMyTurn &&
    myPlayer?.state === 'seen' &&
    prevPlayer?.state === 'seen';

  const getHandBadge = (cards: Card[]) => {
    const evalResult = evaluateHand(cards);
    switch (evalResult.tier) {
      case 'Trail':
        return { label: '👑 TRAIL (TRIO)', bg: 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-white shadow-amber-500/50' };
      case 'Pure Sequence':
        return { label: '💎 PURE RUN', bg: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-emerald-500/50' };
      case 'Sequence':
        return { label: '⚡ RUN', bg: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-purple-500/50' };
      case 'Color':
        return { label: '🎨 COLOR', bg: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/50' };
      case 'Pair':
        return { label: '👥 PAIR', bg: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-orange-500/50' };
      default:
        return { label: '🃏 HIGH CARD', bg: 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-200 shadow-slate-500/20' };
    }
  };

  return (
    <div className="min-h-screen bg-[#060710] text-white flex flex-col justify-between relative overflow-x-hidden select-none">
      {/* 3D Casino Ambient Stage Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-emerald-600/10 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />

      {/* Floating Animated Emotes Across Table */}
      <AnimatePresence>
        {emotes.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.5, y: -120 }}
            exit={{ opacity: 0, scale: 1.8, y: -180 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            style={{ left: `${e.x}%`, top: `${e.y}%` }}
            className="absolute z-50 pointer-events-none text-3xl filter drop-shadow-lg"
          >
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Top Real-Time Approval Toast Notice */}
      <AnimatePresence>
        {approvedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-sm shadow-2xl shadow-amber-500/60 border-2 border-white flex items-center gap-2.5 animate-pulse"
          >
            <Sparkles className="w-5 h-5 text-black" />
            <span>{approvedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-black/80 border-b border-amber-500/20 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/games/teen-patti/lobby"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold border border-white/10 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lobby</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white tracking-wide">{table.tableName}</h1>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  3D Table
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  Boot: {table.bootAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/40 font-mono">• Round #{table.roundCount}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick In-Game Request Chips Button */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 hover:from-amber-500/40 hover:to-yellow-500/40 text-amber-300 border border-amber-400/50 text-xs font-black shadow-md shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
              title="Request chips from admin while playing"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Request Chips</span>
            </button>

            {/* Quick Emote Reactions */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              {['🔥', '🪙', '😎', '👑', '🚀'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerEmote(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer"
                  title="Send Reaction"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Room Code Badge */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
              title="Click to copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{table.roomCode}</span>
            </button>

            {/* User Chip Count */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-400/40 text-xs font-mono font-black text-amber-400 shadow-md shadow-amber-500/20">
              <span>🪙</span>
              <span>{userChips.toLocaleString()}</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main 3D Gaming Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-6xl mx-auto w-full relative perspective-[1200px]">
        {/* ============================================================== */}
        {/* 3D CASINO POKER TABLE STAGE                                    */}
        {/* ============================================================== */}
        <div
          className="relative w-full aspect-[4/3] max-w-4xl max-h-[560px] rounded-[120px] sm:rounded-[200px] border-[8px] sm:border-[12px] border-[#2e190a] shadow-2xl p-4 sm:p-8 flex flex-col items-center justify-between transition-transform duration-500"
          style={{
            transform: 'rotateX(10deg) translateZ(0)',
            transformStyle: 'preserve-3d',
            background: 'radial-gradient(ellipse at center, #07472c 0%, #042e1d 55%, #02170f 100%)',
            boxShadow: `
              inset 0 0 100px rgba(0,0,0,0.9),
              0 30px 80px -20px rgba(0,0,0,0.95),
              0 0 40px rgba(16,185,129,0.2),
              0 0 0 3px rgba(245,158,11,0.3)
            `,
          }}
        >
          {/* Real Wood / Padded Leather Rim Highlight */}
          <div className="absolute inset-1 sm:inset-2 rounded-[110px] sm:rounded-[190px] border border-amber-600/30 pointer-events-none" />

          {/* Golden Felt Inner Betting Boundary Ring */}
          <div className="absolute inset-5 sm:inset-8 rounded-[90px] sm:rounded-[170px] border-2 border-dashed border-amber-400/25 pointer-events-none flex items-center justify-center">
            {/* Center Felt Watermark */}
            <div className="text-center opacity-10 select-none pointer-events-none">
              <span className="font-serif tracking-[0.3em] text-2xl sm:text-4xl font-black text-amber-200 block">
                GAMEVERSE
              </span>
              <span className="font-mono text-xs sm:text-sm tracking-[0.5em] text-white">
                ROYAL TEEN PATTI
              </span>
            </div>
          </div>

          {/* TOP CENTER: 3D Virtual Dealer Aria */}
          <div className="relative z-30 -mt-2 sm:-mt-4">
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

          {/* CENTER FELT: 3D Pot & Physical Chip Stacks */}
          <div className="flex flex-col items-center justify-center my-auto z-20 text-center relative">
            {/* 3D Physical Chip Stacks in Pot */}
            <div className="flex items-center justify-center -space-x-3 mb-2">
              <ChipStack3D amount={Math.floor(table.pot * 0.3)} size="md" showLabel={false} />
              <ChipStack3D amount={table.pot} size="lg" showLabel={false} />
              <ChipStack3D amount={Math.floor(table.pot * 0.4)} size="md" showLabel={false} />
            </div>

            {/* Glowing Pot Pill */}
            <div className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-black/80 border-2 border-amber-400/60 backdrop-blur-xl shadow-2xl shadow-amber-500/30 scale-105">
              <span className="text-xl sm:text-2xl animate-pulse">🪙</span>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-widest text-emerald-300 font-black leading-none">
                  MAIN POT
                </span>
                <span className="font-mono text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow">
                  {table.pot.toLocaleString()}
                </span>
              </div>
            </div>

            <span className="text-[10px] sm:text-xs text-amber-300/80 font-mono font-bold mt-1.5 bg-black/50 px-2.5 py-0.5 rounded-full border border-white/10">
              Current Stake: {table.currentStake.toLocaleString()}
            </span>
          </div>

          {/* ========================================================== */}
          {/* 6 PLAYER SEATS AROUND THE 3D TABLE                         */}
          {/* ========================================================== */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { idx: 0, pos: 'top-2 sm:top-4 left-4 sm:left-12' },
              { idx: 1, pos: 'top-2 sm:top-4 right-4 sm:right-12' },
              { idx: 5, pos: 'top-1/2 -translate-y-1/2 left-2 sm:left-6' },
              { idx: 2, pos: 'top-1/2 -translate-y-1/2 right-2 sm:right-6' },
              { idx: 4, pos: 'bottom-2 sm:bottom-4 left-6 sm:left-20' },
              { idx: 3, pos: 'bottom-2 sm:bottom-4 right-6 sm:right-20' },
            ].map(({ idx, pos }) => {
              const p = table.players[idx];
              const isTurn = table.status === 'active' && table.currentTurnSeat === idx;
              const isMe = p && p.userId === currentUserId;

              return (
                <div key={idx} className={`absolute ${pos} pointer-events-auto z-20`}>
                  {p ? (
                    /* Occupied Player Pod */
                    <div
                      className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-300 backdrop-blur-xl ${
                        isTurn
                          ? 'ring-4 ring-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.6)] scale-110 bg-black/90'
                          : p.state === 'folded'
                          ? 'opacity-40 grayscale bg-black/50'
                          : 'bg-black/75 border border-white/15 shadow-xl'
                      }`}
                    >
                      {/* Avatar with Turn Ring */}
                      <div className="relative">
                        <div
                          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-lg ${
                            isMe
                              ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 ring-2 ring-amber-300'
                              : 'bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800'
                          }`}
                        >
                          {p.avatarUrl || '👑'}
                        </div>

                        {/* Turn Timer Pulse Badge */}
                        {isTurn && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping ring-2 ring-white" />
                        )}

                        {/* Dealer / Seat Icon */}
                        {isMe && (
                          <span className="absolute -bottom-1 -left-1 bg-amber-500 text-black font-black text-[8px] px-1 rounded">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Username */}
                      <span className="text-xs font-black text-white max-w-[85px] sm:max-w-[105px] truncate mt-1">
                        {p.username}
                      </span>

                      {/* Chip Stack Display */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px]">🪙</span>
                        <span className="text-[10px] sm:text-xs font-mono font-black text-amber-300">
                          {p.chips.toLocaleString()}
                        </span>
                      </div>

                      {/* Action State Badge */}
                      <span
                        className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full mt-1 tracking-wider ${
                          p.state === 'blind'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/30'
                            : p.state === 'seen'
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-400/50 shadow-sm shadow-violet-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {p.state}
                      </span>

                      {/* 3 Fanned 3D Cards */}
                      {p.cards && p.cards.length === 3 && (
                        <div className="flex flex-col items-center mt-1.5">
                          <div className="flex items-center -space-x-4">
                            {p.cards.map((c, cIdx) => {
                              const fanAngles = [-9, 0, 9];
                              const shouldHide = (p.state === 'blind' || !isMe) && table.status !== 'settled';
                              return (
                                <CardView
                                  key={cIdx}
                                  card={c}
                                  isFaceDown={shouldHide}
                                  size="sm"
                                  fanAngle={fanAngles[cIdx]}
                                  elevateOnHover={!shouldHide}
                                />
                              );
                            })}
                          </div>

                          {/* Hand Rank Badge (When Seen) */}
                          {isMe && p.state === 'seen' && (
                            <span
                              className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 shadow-md ${
                                getHandBadge(p.cards).bg
                              }`}
                            >
                              {getHandBadge(p.cards).label}
                            </span>
                          )}

                          {/* Blind Indicator */}
                          {isMe && p.state === 'blind' && table.status === 'active' && (
                            <span className="text-[8px] font-black tracking-widest text-cyan-300 uppercase mt-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 animate-pulse">
                              🕶️ PLAYING BLIND
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Open Empty Seat */
                    <button
                      onClick={() => handleSitDown(idx)}
                      disabled={mySeatIndex !== -1}
                      className="px-3.5 py-2.5 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/80 border-2 border-emerald-500/40 text-emerald-300 text-xs font-black flex flex-col items-center gap-1 transition-all hover:scale-105 cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-emerald-950/40"
                    >
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Take Seat #{idx + 1}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3D Round Winner Celebration Modal */}
        <AnimatePresence>
          {table.status === 'settled' && table.winnerResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-40 p-6 sm:p-8 rounded-3xl bg-black/95 border-2 border-amber-400 backdrop-blur-2xl text-center shadow-2xl max-w-md w-full mx-4"
              style={{
                boxShadow: '0 30px 80px -10px rgba(0,0,0,0.95), 0 0 60px rgba(245,158,11,0.5)',
              }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/50 animate-bounce">
                <Trophy className="w-9 h-9 text-black" />
              </div>

              <span className="text-xs font-black uppercase text-amber-300 tracking-[0.2em] block mb-1">
                ★ ROUND WINNER ★
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                {table.winnerResult.winnerName}
              </h2>
              <span className="text-sm text-violet-300 font-bold block mb-4">
                Won with: {table.winnerResult.handName}
              </span>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 mb-6 font-mono">
                <span className="text-xs text-amber-300/70 block">Total Pot Payout</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  +{table.winnerResult.potAmount.toLocaleString()} Chips
                </span>
              </div>

              <button
                onClick={handleStartRound}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/40 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Deal Next Round 🎴
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* IN-GAME CHIP REQUEST MODAL                                     */}
        {/* ============================================================== */}
        <AnimatePresence>
          {showRequestModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-md w-full bg-gradient-to-br from-[#121324] to-[#0c0d18] border-2 border-amber-400/50 rounded-3xl p-6 shadow-2xl relative"
                style={{
                  boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), 0 0 40px rgba(245,158,11,0.3)',
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">REQUEST VIRTUAL CHIPS</h2>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Current balance: {userChips.toLocaleString()} chips
                    </span>
                  </div>
                </div>

                <p className="text-xs text-white/60 mb-4">
                  Request chips directly from admin. Once approved, they will credit into your active game automatically!
                </p>

                {/* Status Message */}
                {requestStatusMsg && (
                  <div
                    className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
                      requestStatusMsg.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {requestStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : null}
                    <span>{requestStatusMsg.text}</span>
                  </div>
                )}

                {/* Amount Presets */}
                <span className="text-[11px] font-bold text-white/80 block mb-2">Select Amount:</span>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {CHIP_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRequestAmount(amt)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                        requestAmount === amt
                          ? 'bg-amber-500 text-black border-amber-300 shadow-md shadow-amber-500/40 scale-105'
                          : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Reason input */}
                <div className="mb-4">
                  <label className="text-[11px] font-bold text-white/80 block mb-1">
                    Note for Admin:
                  </label>
                  <input
                    type="text"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="e.g. In the middle of Teen Patti match"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingRequest}
                    onClick={handleSubmitInGameRequest}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingRequest ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Request</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ============================================================== */}
      {/* BOTTOM ACTION DOCK (FUTURISTIC 3D GAMING HUD)                  */}
      {/* ============================================================== */}
      <footer className="sticky bottom-0 z-40 backdrop-blur-2xl bg-black/90 border-t border-amber-500/30 p-3 sm:p-4 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {mySeatIndex === -1 ? (
            /* User Spectating Mode */
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-white/70">
                You are currently spectating. Click any open seat on the table to join the game!
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Request Chips</span>
                </button>
                <button
                  onClick={handleAddBot}
                  className="px-4 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>Add AI Bot</span>
                </button>
              </div>
            </div>
          ) : table.status !== 'active' ? (
            /* Round Waiting Stage */
            <div className="w-full flex items-center justify-between gap-3">
              <span className="text-xs text-white/70 font-semibold">
                Round finished. Seated: {table.players.filter((p) => p !== null).length}/6 players
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Request Chips</span>
                </button>
                <button
                  onClick={handleAddBot}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>Add Bot</span>
                </button>
                <button
                  onClick={handleStartRound}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all hover:scale-105 cursor-pointer"
                >
                  Deal Hand 🎴
                </button>
              </div>
            </div>
          ) : (
            /* Active Live Hand Controls */
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left Side: See Cards Button or Request Chips */}
              <div className="flex items-center gap-2">
                {myPlayer?.state === 'blind' ? (
                  <button
                    onClick={handleSeeCards}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider border border-violet-400/40 shadow-lg shadow-violet-600/30 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>See Cards (Reveals)</span>
                  </button>
                ) : (
                  myPlayer?.cards && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-violet-300">
                      <span>My Hand:</span>
                      <span className="text-amber-400">{evaluateHand(myPlayer.cards).name}</span>
                    </div>
                  )
                )}

                {/* Quick Request Chips Button if player's chips are low */}
                {(myPlayer?.chips || 0) < limits.minBet && (
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-black animate-pulse flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Get Chips</span>
                  </button>
                )}
              </div>

              {/* Right Side: Bet, Raise, Side Show, Fold */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Pack / Fold */}
                <button
                  onClick={handleFold}
                  disabled={!isMyTurn}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-black text-xs uppercase transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Pack (Fold)
                </button>

                {/* Showdown (when 2 players remain) */}
                {activePlayersCount === 2 && (
                  <button
                    onClick={handleShowdown}
                    disabled={!isMyTurn || (myPlayer?.chips || 0) < limits.minBet}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/40 border border-cyan-400/50 transition-all hover:scale-105 cursor-pointer disabled:opacity-40 animate-pulse flex items-center gap-1.5"
                  >
                    <span>SHOW ({limits.minBet.toLocaleString()})</span>
                  </button>
                )}

                {/* Side Show (when > 2 players remain) */}
                {activePlayersCount > 2 && (
                  <button
                    onClick={handleSideShow}
                    disabled={!canSideShow || (myPlayer?.chips || 0) < limits.minBet}
                    title={
                      myPlayer?.state !== 'seen'
                        ? 'You must See Cards first to request a Side Show'
                        : prevPlayer?.state !== 'seen'
                        ? `${prevPlayer?.username || 'Previous player'} is playing Blind (cannot request Side Show)`
                        : `Request Side Show against ${prevPlayer?.username}`
                    }
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 border border-purple-400/40 transition-all hover:scale-105 cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <span>SIDE SHOW ({limits.minBet.toLocaleString()})</span>
                  </button>
                )}

                {/* Main Action: Chaal or Blind Bet */}
                <button
                  onClick={() => handlePlaceBet(limits.minBet)}
                  disabled={!isMyTurn || (myPlayer?.chips || 0) < limits.minBet}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/40 transition-all hover:scale-105 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {limits.label} ({limits.minBet.toLocaleString()})
                </button>

                {/* Raise 2X */}
                <button
                  onClick={() => handlePlaceBet(limits.maxBet)}
                  disabled={!isMyTurn || (myPlayer?.chips || 0) < limits.maxBet}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase transition-all hover:scale-105 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Raise 2X ({limits.maxBet.toLocaleString()})
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
