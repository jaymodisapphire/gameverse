'use client';

import React, { useState, useEffect, useRef, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RotateCcw,
  Bot,
  Users,
  Trophy,
  Dices,
  Sparkles,
  Copy,
  Check,
  Globe,
  Radio,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { gameAudio } from '@/lib/games/audio';
import { useAuth } from '@/lib/auth/auth-context';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  LudoColor,
  LudoGameState,
  LUDO_COLORS,
  LUDO_CONFIG,
  chooseBestLudoMove,
  createInitialLudoState,
  getAbsoluteTrackIndex,
  SAFE_TRACK_POSITIONS,
} from '@/lib/games/ludo-engine';
import {
  generateRoomCode,
  RoomChannel,
  saveRoomState,
  getRoomState,
} from '@/lib/multiplayer/room-manager';

function LudoArenaContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  const { user, profile } = useAuth();

  const [gameState, setGameState] = useState<LudoGameState>(() => {
    return createInitialLudoState(
      roomParam ? 'online' : 'bot',
      profile?.username || user?.user_metadata?.full_name || 'Commander',
      roomParam || undefined
    );
  });

  const [copied, setCopied] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const channelRef = useRef<RoomChannel | null>(null);

  // Initialize or switch room channel
  useEffect(() => {
    if (gameState.mode === 'online' && gameState.roomCode) {
      const channel = new RoomChannel(gameState.roomCode);
      channelRef.current = channel;

      const unsubscribe = channel.onMessage((event, payload) => {
        if (event === 'SYNC_STATE') {
          setGameState(payload);
        } else if (event === 'DICE_ROLLED') {
          gameAudio.playClick();
          setGameState((prev) => ({
            ...prev,
            diceValue: payload.diceValue,
            hasRolled: true,
            isRolling: false,
          }));
        } else if (event === 'PAWN_MOVED') {
          gameAudio.playEat();
          setGameState(payload.nextState);
        }
      });

      return () => {
        unsubscribe();
        channel.close();
      };
    }
  }, [gameState.mode, gameState.roomCode]);

  // Handle Bot Turn automatically
  useEffect(() => {
    if (gameState.winner) return;

    const currentPlayer = gameState.players.find((p) => p.color === gameState.turn);
    if (!currentPlayer || !currentPlayer.isBot) return;

    // Bot needs to roll dice
    if (!gameState.hasRolled && !gameState.isRolling) {
      const timer = setTimeout(() => {
        botRollDice();
      }, 700);
      return () => clearTimeout(timer);
    }

    // Bot has rolled, choose pawn
    if (gameState.hasRolled && !gameState.isRolling) {
      const timer = setTimeout(() => {
        botMovePawn();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.hasRolled, gameState.isRolling, gameState.winner]);

  const syncStateToPeers = (newState: LudoGameState) => {
    setGameState(newState);
    if (newState.mode === 'online' && newState.roomCode && channelRef.current) {
      channelRef.current.broadcast('SYNC_STATE', newState);
      saveRoomState(newState.roomCode, newState);
    }
  };

  const handleRollDice = () => {
    if (gameState.isRolling || gameState.hasRolled || gameState.winner) return;

    // Check if it's user's turn in bot or online mode
    const activePlayer = gameState.players.find((p) => p.color === gameState.turn);
    if (gameState.mode === 'bot' && activePlayer?.isBot) return;

    setGameState((prev) => ({ ...prev, isRolling: true }));
    gameAudio.playClick();

    let rollCount = 0;
    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        diceValue: Math.floor(Math.random() * 6) + 1,
      }));
      rollCount++;

      if (rollCount > 6) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        const currentPawns = gameState.pawns[gameState.turn];
        const canMoveAny = currentPawns.some(
          (step) => step !== 57 && (step !== -1 || finalValue === 6)
        );

        const updated: LudoGameState = {
          ...gameState,
          diceValue: finalValue,
          isRolling: false,
          hasRolled: true,
          gameLog: canMoveAny
            ? [`${LUDO_CONFIG[gameState.turn].name} rolled a ${finalValue}. Select a pawn to move.`, ...gameState.gameLog.slice(0, 6)]
            : [`${LUDO_CONFIG[gameState.turn].name} rolled a ${finalValue}. No legal moves. Turn passed.`, ...gameState.gameLog.slice(0, 6)],
        };

        if (!canMoveAny) {
          syncStateToPeers(updated);
          setTimeout(() => advanceTurn(updated, false), 900);
        } else {
          syncStateToPeers(updated);
        }
      }
    }, 70);
  };

  const botRollDice = () => {
    setGameState((prev) => ({ ...prev, isRolling: true }));
    gameAudio.playClick();

    setTimeout(() => {
      const finalValue = Math.floor(Math.random() * 6) + 1;
      const currentPawns = gameState.pawns[gameState.turn];
      const canMoveAny = currentPawns.some(
        (step) => step !== 57 && (step !== -1 || finalValue === 6)
      );

      const updated: LudoGameState = {
        ...gameState,
        diceValue: finalValue,
        isRolling: false,
        hasRolled: true,
        gameLog: canMoveAny
          ? [`🤖 ${LUDO_CONFIG[gameState.turn].botName} rolled a ${finalValue}. Moving pawn...`, ...gameState.gameLog.slice(0, 6)]
          : [`🤖 ${LUDO_CONFIG[gameState.turn].botName} rolled a ${finalValue}. No legal move.`, ...gameState.gameLog.slice(0, 6)],
      };

      if (!canMoveAny) {
        syncStateToPeers(updated);
        setTimeout(() => advanceTurn(updated, false), 800);
      } else {
        syncStateToPeers(updated);
      }
    }, 500);
  };

  const botMovePawn = () => {
    const bestIndex = chooseBestLudoMove(
      gameState.turn,
      gameState.pawns,
      gameState.diceValue
    );

    if (bestIndex !== null) {
      executePawnMove(gameState.turn, bestIndex);
    } else {
      advanceTurn(gameState, false);
    }
  };

  const executePawnMove = (color: LudoColor, pawnIndex: number) => {
    if (color !== gameState.turn || !gameState.hasRolled || gameState.isRolling || gameState.winner) {
      return;
    }

    const currentStep = gameState.pawns[color][pawnIndex];
    if (currentStep === 57) return;

    // Deploying from base
    if (currentStep === -1) {
      if (gameState.diceValue !== 6) return;
      gameAudio.playBoost();
      const newPawns = { ...gameState.pawns, [color]: [...gameState.pawns[color]] };
      newPawns[color][pawnIndex] = 0;

      const updated: LudoGameState = {
        ...gameState,
        pawns: newPawns,
        gameLog: [`🚀 ${LUDO_CONFIG[color].name} deployed pawn #${pawnIndex + 1} to track!`, ...gameState.gameLog.slice(0, 6)],
      };

      // Bonus turn for rolling 6
      advanceTurn(updated, true);
      return;
    }

    // Advancing on track or home path
    const targetStep = currentStep + gameState.diceValue;
    if (targetStep > 57) return;

    gameAudio.playEat();
    const newPawns = { ...gameState.pawns, [color]: [...gameState.pawns[color]] };
    newPawns[color][pawnIndex] = targetStep;

    let logMsg = `${LUDO_CONFIG[color].name} advanced pawn #${pawnIndex + 1} to step ${targetStep}.`;

    // Check pawn capture on track (steps 0..51)
    if (targetStep <= 51) {
      const myAbs = getAbsoluteTrackIndex(color, targetStep);
      if (myAbs !== null && !SAFE_TRACK_POSITIONS.includes(myAbs)) {
        for (const otherColor of LUDO_COLORS) {
          if (otherColor === color) continue;
          newPawns[otherColor] = newPawns[otherColor].map((step) => {
            if (step >= 0 && step <= 51) {
              const otherAbs = getAbsoluteTrackIndex(otherColor, step);
              if (otherAbs === myAbs) {
                gameAudio.playLaser();
                logMsg = `💥 ${LUDO_CONFIG[color].name} CAPTURED ${LUDO_CONFIG[otherColor].name}'s pawn!`;
                return -1; // Send back to base!
              }
            }
            return step;
          });
        }
      }
    }

    // Check Victory
    if (targetStep === 57) {
      logMsg = `⭐ ${LUDO_CONFIG[color].name} pawn #${pawnIndex + 1} reached the Quantum Core!`;
      if (newPawns[color].every((s) => s === 57)) {
        gameAudio.playVictory();
        const winState: LudoGameState = {
          ...gameState,
          pawns: newPawns,
          winner: color,
          gameLog: [`🏆 VICTORY! ${LUDO_CONFIG[color].name} has conquered Cyber Ludo!`, ...gameState.gameLog.slice(0, 6)],
        };
        syncStateToPeers(winState);
        return;
      }
    }

    const nextState: LudoGameState = {
      ...gameState,
      pawns: newPawns,
      gameLog: [logMsg, ...gameState.gameLog.slice(0, 6)],
    };

    advanceTurn(nextState, gameState.diceValue === 6);
  };

  const advanceTurn = (state: LudoGameState, earnedBonus: boolean) => {
    if (earnedBonus) {
      const bonusState: LudoGameState = {
        ...state,
        hasRolled: false,
        gameLog: [`✨ ${LUDO_CONFIG[state.turn].name} earned a bonus roll for rolling a 6!`, ...state.gameLog.slice(0, 6)],
      };
      syncStateToPeers(bonusState);
      return;
    }

    const currentIdx = LUDO_COLORS.indexOf(state.turn);
    const nextTurn = LUDO_COLORS[(currentIdx + 1) % 4];

    const nextState: LudoGameState = {
      ...state,
      turn: nextTurn,
      hasRolled: false,
    };
    syncStateToPeers(nextState);
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode('LUDO');
    const newState = createInitialLudoState('online', profile?.username || 'Host Commander', code);
    syncStateToPeers(newState);
    setShowRoomModal(false);
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) return;
    const cleanCode = roomInput.trim().toUpperCase();
    const existing = getRoomState<LudoGameState>(cleanCode);
    if (existing) {
      setGameState(existing);
    } else {
      const newState = createInitialLudoState('online', profile?.username || 'Guest Pilot', cleanCode);
      syncStateToPeers(newState);
    }
    setShowRoomModal(false);
  };

  const handleSwitchMode = (mode: 'bot' | 'local' | 'online') => {
    if (mode === 'online') {
      setShowRoomModal(true);
      return;
    }
    const newState = createInitialLudoState(
      mode,
      profile?.username || user?.user_metadata?.full_name || 'Commander'
    );
    syncStateToPeers(newState);
  };

  const handleResetGame = () => {
    const newState = createInitialLudoState(
      gameState.mode,
      profile?.username || 'Commander',
      gameState.roomCode
    );
    syncStateToPeers(newState);
  };

  const handleCopyInvite = () => {
    if (!gameState.roomCode) return;
    const url = `${window.location.origin}/games/ludo?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeColorConfig = LUDO_CONFIG[gameState.turn];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden flex flex-col justify-between">
      <Navbar />

      {/* Cyber Background Glow */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[300px] rounded-full bg-rose-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[300px] rounded-full bg-cyan-600/10 blur-[130px] pointer-events-none" />

      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16 w-full relative z-10">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/multiplayer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Multiplayer Hub</span>
          </Link>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => handleSwitchMode('bot')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                gameState.mode === 'bot'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Play with Bot</span>
            </button>

            <button
              onClick={() => handleSwitchMode('online')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                gameState.mode === 'online'
                  ? 'bg-cyan-500 text-black font-extrabold shadow-lg shadow-cyan-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Custom Room</span>
            </button>

            <button
              onClick={() => handleSwitchMode('local')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                gameState.mode === 'local'
                  ? 'bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-400/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pass & Play</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetGame}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Reset Match"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                gameAudio.setMuted(next);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Mute / Unmute"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Custom Room Code Banner */}
        {gameState.mode === 'online' && gameState.roomCode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 mb-6 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <div className="text-xs">
                <span className="text-white/40 uppercase font-mono mr-2">Custom Room Code:</span>
                <span className="text-cyan-300 font-mono font-black text-sm">{gameState.roomCode}</span>
              </div>
            </div>

            <button
              onClick={handleCopyInvite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </motion.div>
        )}

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-widest mb-3">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Cyber Board Battles • 2-4 Players</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            CYBER{' '}
            <span className="bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
              LUDO ARENA
            </span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1.5">
            Deploy pawns on a 6, hunt opponents across the quantum ring, and race to the core.
          </p>
        </div>

        {/* Main Grid: Player Pods & Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Player Cards */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Arena Pilots</h2>
            {LUDO_COLORS.map((c) => {
              const cfg = LUDO_CONFIG[c];
              const player = gameState.players.find((p) => p.color === c);
              const isCurrentTurn = gameState.turn === c;
              const homeCount = gameState.pawns[c].filter((s) => s === 57).length;

              return (
                <div
                  key={c}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrentTurn
                      ? `${cfg.border} bg-white/10 shadow-lg scale-[1.02]`
                      : 'border-white/10 bg-white/5 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3.5 h-3.5 rounded-full ${cfg.bg}`} />
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          {player?.name || cfg.name}
                          {player?.isBot && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              BOT
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-white/40">{homeCount}/4 Pawns Home</p>
                      </div>
                    </div>
                    {isCurrentTurn && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-black animate-pulse">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Pawns visual indicators */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {gameState.pawns[c].map((step, idx) => (
                      <div
                        key={idx}
                        className={`text-center py-1 rounded-lg text-[10px] font-mono font-bold ${
                          step === 57
                            ? 'bg-amber-400 text-black'
                            : step === -1
                            ? 'bg-white/5 text-white/30 border border-white/5'
                            : `${cfg.bg}/30 ${cfg.text} border border-current`
                        }`}
                      >
                        {step === 57 ? '★ CORE' : step === -1 ? 'BASE' : `S-${step}`}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Column: Interactive Quantum Board & Dice */}
          <div className="flex flex-col items-center">
            {/* Quantum Core Board */}
            <div className="w-full max-w-[420px] aspect-square rounded-3xl bg-gray-950 border-2 border-white/15 p-4 shadow-2xl relative flex flex-col justify-between overflow-hidden">
              {/* Corner Bases */}
              <div className="grid grid-cols-2 gap-4 h-[42%]">
                {/* Red Base */}
                <div className="rounded-2xl border-2 border-rose-500/40 bg-rose-500/10 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-rose-400">RED BASE</span>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.pawns.red.map((step, i) => (
                      <button
                        key={i}
                        onClick={() => executePawnMove('red', i)}
                        disabled={gameState.turn !== 'red' || !gameState.hasRolled}
                        className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                          step === -1
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 hover:scale-110 cursor-pointer animate-pulse'
                            : 'bg-rose-500/20 text-rose-300 opacity-40'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Green Base */}
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-emerald-400">GREEN BASE</span>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.pawns.green.map((step, i) => (
                      <button
                        key={i}
                        onClick={() => executePawnMove('green', i)}
                        disabled={gameState.turn !== 'green' || !gameState.hasRolled}
                        className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                          step === -1
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 hover:scale-110 cursor-pointer'
                            : 'bg-emerald-500/20 text-emerald-300 opacity-40'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center Quantum Core */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/40 border border-white/20 animate-pulse">
                  <Trophy className="w-8 h-8 text-amber-300" />
                </div>
              </div>

              {/* Bottom Corner Bases */}
              <div className="grid grid-cols-2 gap-4 h-[42%]">
                {/* Blue Base */}
                <div className="rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-cyan-400">BLUE BASE</span>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.pawns.blue.map((step, i) => (
                      <button
                        key={i}
                        onClick={() => executePawnMove('blue', i)}
                        disabled={gameState.turn !== 'blue' || !gameState.hasRolled}
                        className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                          step === -1
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 hover:scale-110 cursor-pointer'
                            : 'bg-cyan-500/20 text-cyan-300 opacity-40'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yellow Base */}
                <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/10 p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-amber-400">YELLOW BASE</span>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.pawns.yellow.map((step, i) => (
                      <button
                        key={i}
                        onClick={() => executePawnMove('yellow', i)}
                        disabled={gameState.turn !== 'yellow' || !gameState.hasRolled}
                        className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                          step === -1
                            ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/50 hover:scale-110 cursor-pointer'
                            : 'bg-amber-400/20 text-amber-300 opacity-40'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dice Control Station */}
            <div className="mt-6 flex flex-col items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRollDice}
                disabled={gameState.isRolling || gameState.hasRolled || Boolean(gameState.winner)}
                className={`relative px-8 py-4 rounded-3xl font-black text-lg flex items-center gap-4 transition-all shadow-xl cursor-pointer ${
                  gameState.hasRolled
                    ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                    : `${activeColorConfig.bg} text-white hover:brightness-110`
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-black/30 border border-white/20 flex items-center justify-center font-mono text-2xl font-black">
                  {gameState.diceValue}
                </div>
                <div className="text-left">
                  <p className="text-xs uppercase font-mono tracking-wider opacity-80">
                    {gameState.turn.toUpperCase()} TURN
                  </p>
                  <p className="text-sm font-black">
                    {gameState.isRolling ? 'ROLLING...' : gameState.hasRolled ? 'SELECT PAWN' : 'ROLL DICE'}
                  </p>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Right Column: Active Pawns & Mission Log */}
          <div className="space-y-4">
            {/* Active Turn Pawn Controls */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                {activeColorConfig.name} Pawns
              </h3>
              <div className="space-y-2">
                {gameState.pawns[gameState.turn].map((step, idx) => {
                  const canMove = gameState.hasRolled && (step !== -1 || gameState.diceValue === 6) && step !== 57;

                  return (
                    <button
                      key={idx}
                      onClick={() => executePawnMove(gameState.turn, idx)}
                      disabled={!canMove}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                        canMove
                          ? 'border-violet-500/50 bg-violet-500/15 hover:bg-violet-500/25 text-white cursor-pointer shadow-md'
                          : 'border-white/5 bg-white/2 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${activeColorConfig.bg}`} />
                        Pawn #{idx + 1}
                      </span>
                      <span>
                        {step === -1 ? 'In Base (Needs 6)' : step === 57 ? 'Finished ★' : `Step ${step}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mission Log */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Cyber Log</h3>
              <div className="space-y-1.5 text-xs font-mono">
                {gameState.gameLog.map((log, i) => (
                  <p key={i} className={i === 0 ? 'text-white font-semibold' : 'text-white/40'}>
                    › {log}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Winner Celebration Modal */}
      <AnimatePresence>
        {gameState.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full p-6 rounded-3xl bg-gray-900 border border-amber-500/40 text-center shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">MATCH COMPLETED</h2>
              <p className="text-amber-300 font-bold mb-6">
                🏆 {LUDO_CONFIG[gameState.winner].name} HAS WON THE MATCH!
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleResetGame}
                  className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm transition-all cursor-pointer"
                >
                  Play Again
                </button>
                <Link
                  href="/multiplayer"
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
                >
                  Return to Hub
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Join Custom Room Modal */}
      <AnimatePresence>
        {showRoomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="max-w-md w-full p-6 rounded-3xl bg-gray-900 border border-cyan-500/40 shadow-2xl"
            >
              <h2 className="text-xl font-black text-white mb-1">Custom Ludo Room</h2>
              <p className="text-xs text-white/50 mb-6">Play with friends via private room code or URL</p>

              <div className="space-y-4">
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  Create New Room
                </button>

                <div className="flex items-center gap-2 my-2">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-[10px] uppercase font-mono text-white/30">OR JOIN WITH CODE</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    placeholder="e.g. LUDO-482910"
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-cyan-500 uppercase font-mono"
                  />
                  <button
                    onClick={handleJoinRoom}
                    className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all cursor-pointer"
                  >
                    Join
                  </button>
                </div>

                <button
                  onClick={() => setShowRoomModal(false)}
                  className="w-full py-2.5 text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function LudoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Arena...</div>}>
      <LudoArenaContent />
    </Suspense>
  );
}
