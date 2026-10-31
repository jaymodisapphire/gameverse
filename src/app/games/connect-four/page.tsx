'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RotateCcw,
  Bot,
  Users,
  Trophy,
  Sparkles,
  Volume2,
  VolumeX,
  Globe,
  Copy,
  Check,
  Radio,
  ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { gameAudio } from '@/lib/games/audio';
import { useAuth } from '@/lib/auth/auth-context';
import {
  C4Player,
  C4Cell,
  ROWS,
  COLS,
  createEmptyGrid,
  getDropRow,
  canDrop,
  checkC4Winner,
  getC4AIMove,
} from '@/lib/games/connect-four-engine';
import {
  generateRoomCode,
  RoomChannel,
  saveRoomState,
  getRoomState,
} from '@/lib/multiplayer/room-manager';

function ConnectFourContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  const { user, profile } = useAuth();

  const [grid, setGrid] = useState<C4Cell[][]>(() => createEmptyGrid());
  const [turn, setTurn] = useState<C4Player>('red');
  const [mode, setMode] = useState<'ai' | 'pvp' | 'online'>(roomParam ? 'online' : 'ai');
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('hard');
  const [roomCode, setRoomCode] = useState<string>(roomParam || '');
  const [myPlayer, setMyPlayer] = useState<C4Player>('red');
  const [scores, setScores] = useState({ red: 0, cyan: 0, ties: 0 });
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const channelRef = useRef<RoomChannel | null>(null);

  // Online Realtime Channel Setup
  useEffect(() => {
    if (mode === 'online' && roomCode) {
      const channel = new RoomChannel(roomCode);
      channelRef.current = channel;

      const unsubscribe = channel.onMessage((event, payload) => {
        if (event === 'DROP') {
          gameAudio.playClick();
          setGrid(payload.grid);
          setTurn(payload.turn);
        } else if (event === 'RESET') {
          setGrid(createEmptyGrid());
          setTurn('red');
        }
      });

      return () => {
        unsubscribe();
        channel.close();
      };
    }
  }, [mode, roomCode]);

  const winInfo = checkC4Winner(grid);

  // Bot Turn Handler
  useEffect(() => {
    if (mode === 'ai' && turn === 'cyan' && !winInfo) {
      const timer = setTimeout(() => {
        const botCol = getC4AIMove(grid, difficulty);
        handleDrop(botCol, true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, mode, grid, winInfo, difficulty]);

  const handleEndGame = (winner: C4Player | 'Tie') => {
    if (winner === 'red') {
      gameAudio.playVictory();
      setScores((s) => ({ ...s, red: s.red + 1 }));
    } else if (winner === 'cyan') {
      gameAudio.playGameOver();
      setScores((s) => ({ ...s, cyan: s.cyan + 1 }));
    } else {
      gameAudio.playClick();
      setScores((s) => ({ ...s, ties: s.ties + 1 }));
    }
  };

  const handleDrop = (col: number, isBotAction = false) => {
    if (winInfo) return;
    if (!canDrop(grid, col)) return;

    if (mode === 'online' && turn !== myPlayer) return;
    if (mode === 'ai' && turn === 'cyan' && !isBotAction) return;

    const row = getDropRow(grid, col);
    if (row === null) return;

    gameAudio.playClick();
    const nextGrid = grid.map((r) => [...r]);
    nextGrid[row][col] = turn;

    const nextTurn: C4Player = turn === 'red' ? 'cyan' : 'red';
    setGrid(nextGrid);
    setTurn(nextTurn);

    if (mode === 'online' && channelRef.current) {
      channelRef.current.broadcast('DROP', {
        grid: nextGrid,
        turn: nextTurn,
      });
    }

    const result = checkC4Winner(nextGrid);
    if (result) {
      handleEndGame(result.winner);
    }
  };

  const handleReset = () => {
    const fresh = createEmptyGrid();
    setGrid(fresh);
    setTurn('red');
    if (mode === 'online' && channelRef.current) {
      channelRef.current.broadcast('RESET', {});
    }
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode('C4');
    setRoomCode(code);
    setMyPlayer('red');
    setMode('online');
    setGrid(createEmptyGrid());
    setTurn('red');
    setShowRoomModal(false);
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) return;
    const clean = roomInput.trim().toUpperCase();
    setRoomCode(clean);
    setMyPlayer('cyan');
    setMode('online');
    setGrid(createEmptyGrid());
    setTurn('red');
    setShowRoomModal(false);
  };

  const handleCopyLink = () => {
    if (!roomCode) return;
    const url = `${window.location.origin}/games/connect-four?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWinningCell = (r: number, c: number): boolean => {
    return Boolean(
      winInfo?.winningCoords.some(([wr, wc]) => wr === r && wc === c)
    );
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden flex flex-col justify-between">
      <Navbar />

      {/* Ambient background glows */}
      <div className="absolute top-20 left-1/3 w-[600px] h-[350px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[350px] rounded-full bg-rose-600/10 blur-[140px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-4 pt-28 pb-16 w-full relative z-10 flex flex-col items-center">
        {/* Top Control Bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link
            href="/multiplayer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Multiplayer Hub</span>
          </Link>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setMode('ai')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'ai'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Play with Bot</span>
            </button>

            <button
              onClick={() => setShowRoomModal(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'online'
                  ? 'bg-cyan-500 text-black font-extrabold shadow-lg shadow-cyan-500/25'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Custom Room</span>
            </button>

            <button
              onClick={() => setMode('pvp')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'pvp'
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
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Reset Board"
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
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Custom Room Banner */}
        {mode === 'online' && roomCode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 mb-6 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <div className="text-xs">
                <span className="text-white/40 uppercase font-mono mr-2">Custom Room Code:</span>
                <span className="text-cyan-300 font-mono font-black text-sm">{roomCode}</span>
                <span className="ml-3 px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/70">
                  You are:{' '}
                  <strong className={myPlayer === 'red' ? 'text-rose-400' : 'text-cyan-400'}>
                    {myPlayer === 'red' ? 'Red' : 'Cyan'}
                  </strong>
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </motion.div>
        )}

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Gravity Grid Strategy • 2 Players</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            CYBER{' '}
            <span className="bg-gradient-to-r from-rose-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              CONNECT FOUR
            </span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Drop quantum discs into the 7-column matrix to align 4 in any direction.
          </p>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-6">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Red (Pilot)</p>
            <p className="text-2xl font-black text-rose-400">{scores.red}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Ties</p>
            <p className="text-2xl font-black text-white">{scores.ties}</p>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              {mode === 'ai' ? 'Cyan (AI Sentinel)' : 'Cyan (Opponent)'}
            </p>
            <p className="text-2xl font-black text-cyan-400">{scores.cyan}</p>
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="mb-4 text-xs font-bold uppercase tracking-wider">
          {winInfo ? (
            winInfo.winner === 'Tie' ? (
              <span className="text-amber-400">Quantum Grid Full - Draw!</span>
            ) : (
              <span className="text-emerald-400">
                🏆 Winner: Player {winInfo.winner === 'red' ? 'Red' : 'Cyan'}!
              </span>
            )
          ) : (
            <span className="text-white/60">
              Active Turn:{' '}
              <strong className={turn === 'red' ? 'text-rose-400' : 'text-cyan-400'}>
                {turn === 'red' ? 'Cyber Red' : 'Quantum Cyan'}
              </strong>
            </span>
          )}
        </div>

        {/* Connect 4 Matrix Board */}
        <div className="w-full max-w-lg p-4 sm:p-6 rounded-3xl bg-gray-950 border-2 border-indigo-500/30 shadow-2xl shadow-indigo-950/50">
          {/* Drop Column Trigger Headers */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-3">
            {Array.from({ length: COLS }).map((_, col) => {
              const isPlayable = canDrop(grid, col) && !winInfo;
              const isHovered = hoverCol === col;

              return (
                <button
                  key={col}
                  onClick={() => handleDrop(col)}
                  onMouseEnter={() => setHoverCol(col)}
                  onMouseLeave={() => setHoverCol(null)}
                  disabled={!isPlayable}
                  className={`h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isPlayable
                      ? isHovered
                        ? turn === 'red'
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500'
                          : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                      : 'opacity-10 cursor-not-allowed'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* 6x7 Cell Matrix */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const winning = isWinningCell(r, c);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleDrop(c)}
                    onMouseEnter={() => setHoverCol(c)}
                    onMouseLeave={() => setHoverCol(null)}
                    disabled={Boolean(winInfo)}
                    className="aspect-square rounded-full flex items-center justify-center relative overflow-hidden transition-all cursor-pointer"
                  >
                    <div
                      className={`w-full h-full rounded-full border-2 transition-all duration-300 ${
                        cell === 'red'
                          ? winning
                            ? 'bg-rose-500 border-amber-300 shadow-lg shadow-rose-500/80 animate-pulse'
                            : 'bg-rose-500 border-rose-400 shadow-md shadow-rose-500/40'
                          : cell === 'cyan'
                          ? winning
                            ? 'bg-cyan-400 border-amber-300 shadow-lg shadow-cyan-400/80 animate-pulse'
                            : 'bg-cyan-400 border-cyan-300 shadow-md shadow-cyan-400/40'
                          : 'bg-black/60 border-indigo-900/40 hover:border-indigo-500/40'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Custom Room Modal */}
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
              <h2 className="text-xl font-black text-white mb-1">Custom Connect Four Room</h2>
              <p className="text-xs text-white/50 mb-6">Play with friends via private room code</p>

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
                    placeholder="e.g. C4-482910"
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

export default function ConnectFourPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <ConnectFourContent />
    </Suspense>
  );
}
