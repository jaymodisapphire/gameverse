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
  Smile,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { gameAudio } from '@/lib/games/audio';
import { useAuth } from '@/lib/auth/auth-context';
import {
  TTTSquare,
  TTTMark,
  checkTTTWinner,
  getTTTAIMove,
  WINNING_LINES,
} from '@/lib/games/tic-tac-toe-engine';
import {
  generateRoomCode,
  RoomChannel,
  saveRoomState,
  getRoomState,
} from '@/lib/multiplayer/room-manager';

interface TTTState {
  board: TTTSquare[];
  isXNext: boolean;
  mode: 'ai' | 'pvp' | 'online';
  difficulty: 'easy' | 'medium' | 'hard';
  roomCode?: string;
  scores: { x: number; o: number; ties: number };
  myMark: TTTMark;
  lastEmote?: { from: string; emote: string };
}

function TicTacToeContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  const { user, profile } = useAuth();

  const [board, setBoard] = useState<TTTSquare[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [mode, setMode] = useState<'ai' | 'pvp' | 'online'>(roomParam ? 'online' : 'ai');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('hard');
  const [roomCode, setRoomCode] = useState<string>(roomParam || '');
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });
  const [myMark, setMyMark] = useState<TTTMark>('X');
  const [copied, setCopied] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [activeEmote, setActiveEmote] = useState<string | null>(null);

  const channelRef = useRef<RoomChannel | null>(null);

  // Setup Online Custom Room Sync
  useEffect(() => {
    if (mode === 'online' && roomCode) {
      const channel = new RoomChannel(roomCode);
      channelRef.current = channel;

      const unsubscribe = channel.onMessage((event, payload) => {
        if (event === 'MOVE') {
          gameAudio.playClick();
          setBoard(payload.board);
          setIsXNext(payload.isXNext);
        } else if (event === 'RESET') {
          setBoard(Array(9).fill(null));
          setIsXNext(true);
        } else if (event === 'EMOTE') {
          gameAudio.playLaser();
          setActiveEmote(payload.emote);
          setTimeout(() => setActiveEmote(null), 2500);
        }
      });

      return () => {
        unsubscribe();
        channel.close();
      };
    }
  }, [mode, roomCode]);

  const winInfo = checkTTTWinner(board);

  // Bot Turn Handler
  useEffect(() => {
    if (mode === 'ai' && !isXNext && !winInfo) {
      const timer = setTimeout(() => {
        const move = getTTTAIMove(board, difficulty);
        if (move !== -1) {
          gameAudio.playLaser();
          const next = [...board];
          next[move] = 'O';
          setBoard(next);
          setIsXNext(true);

          const result = checkTTTWinner(next);
          if (result) {
            handleEndGame(result.winner);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, mode, board, winInfo, difficulty]);

  const handleEndGame = (winner: TTTMark | 'Tie') => {
    if (winner === 'X') {
      gameAudio.playVictory();
      setScores((s) => ({ ...s, x: s.x + 1 }));
    } else if (winner === 'O') {
      gameAudio.playGameOver();
      setScores((s) => ({ ...s, o: s.o + 1 }));
    } else {
      gameAudio.playClick();
      setScores((s) => ({ ...s, ties: s.ties + 1 }));
    }
  };

  const handleClick = (index: number) => {
    if (board[index] || winInfo) return;

    if (mode === 'online') {
      const currentTurnMark: TTTMark = isXNext ? 'X' : 'O';
      if (currentTurnMark !== myMark) return; // Wait for opponent
    }

    if (mode === 'ai' && !isXNext) return;

    gameAudio.playClick();
    const nextBoard = [...board];
    const mark: TTTMark = isXNext ? 'X' : 'O';
    nextBoard[index] = mark;
    const nextTurn = !isXNext;

    setBoard(nextBoard);
    setIsXNext(nextTurn);

    if (mode === 'online' && channelRef.current) {
      channelRef.current.broadcast('MOVE', {
        board: nextBoard,
        isXNext: nextTurn,
      });
    }

    const result = checkTTTWinner(nextBoard);
    if (result) {
      handleEndGame(result.winner);
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    if (mode === 'online' && channelRef.current) {
      channelRef.current.broadcast('RESET', {});
    }
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode('TTT');
    setRoomCode(code);
    setMyMark('X');
    setMode('online');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setShowRoomModal(false);
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) return;
    const clean = roomInput.trim().toUpperCase();
    setRoomCode(clean);
    setMyMark('O'); // Guest plays as 'O'
    setMode('online');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setShowRoomModal(false);
  };

  const handleCopyLink = () => {
    if (!roomCode) return;
    const url = `${window.location.origin}/games/tic-tac-toe?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmote = (emote: string) => {
    gameAudio.playLaser();
    setActiveEmote(emote);
    setTimeout(() => setActiveEmote(null), 2500);
    if (mode === 'online' && channelRef.current) {
      channelRef.current.broadcast('EMOTE', { emote });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden flex flex-col justify-between">
      <Navbar />

      {/* Cyber Ambient Glows */}
      <div className="absolute top-24 left-1/3 w-[500px] h-[300px] rounded-full bg-rose-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-[500px] h-[300px] rounded-full bg-cyan-600/10 blur-[130px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-4 pt-28 pb-16 w-full relative z-10 flex flex-col items-center">
        {/* Top Navigation & Mode Switcher */}
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
                  You are: <strong className="text-cyan-300">{myMark}</strong>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Cyber Strategy • 2 Players</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            NEON{' '}
            <span className="bg-gradient-to-r from-rose-500 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              TIC TAC TOE
            </span>
          </h1>
        </div>

        {/* Difficulty Selector in Bot Mode */}
        {mode === 'ai' && (
          <div className="flex items-center gap-2 mb-6 p-1 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-white/40 px-2 font-mono uppercase">AI Difficulty:</span>
            {(['easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  difficulty === diff
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {diff === 'easy' ? 'Casual' : diff === 'medium' ? 'Tactical' : 'Unbeatable'}
              </button>
            ))}
          </div>
        )}

        {/* Scoreboard */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">X (Player)</p>
            <p className="text-2xl font-black text-rose-400">{scores.x}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Ties</p>
            <p className="text-2xl font-black text-white">{scores.ties}</p>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              {mode === 'ai' ? 'O (Cyber Bot)' : 'O (Opponent)'}
            </p>
            <p className="text-2xl font-black text-cyan-400">{scores.o}</p>
          </div>
        </div>

        {/* Active Emote Float */}
        <AnimatePresence>
          {activeEmote && (
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1.2, y: -20 }}
              exit={{ scale: 0, opacity: 0 }}
              className="mb-4 px-4 py-2 rounded-2xl bg-violet-600 text-white font-black text-sm shadow-xl shadow-violet-500/50"
            >
              {activeEmote}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Turn Status */}
        <div className="mb-4 text-xs font-bold uppercase tracking-wider">
          {winInfo ? (
            winInfo.winner === 'Tie' ? (
              <span className="text-amber-400">Match Drawn!</span>
            ) : (
              <span className="text-emerald-400">Winner: Player {winInfo.winner}!</span>
            )
          ) : (
            <span className="text-white/60">
              Current Turn:{' '}
              <strong className={isXNext ? 'text-rose-400' : 'text-cyan-400'}>
                {isXNext ? 'X' : 'O'}
              </strong>
            </span>
          )}
        </div>

        {/* 3x3 Grid Board */}
        <div className="w-full max-w-[340px] aspect-square grid grid-cols-3 gap-3 p-4 rounded-3xl bg-gray-950 border-2 border-white/15 shadow-2xl">
          {board.map((val, idx) => {
            const isWinningCell = winInfo?.line?.includes(idx);

            return (
              <motion.button
                key={idx}
                whileHover={{ scale: val ? 1 : 1.04 }}
                whileTap={{ scale: val ? 1 : 0.96 }}
                onClick={() => handleClick(idx)}
                disabled={Boolean(val) || Boolean(winInfo)}
                className={`rounded-2xl border-2 flex items-center justify-center font-black text-4xl transition-all cursor-pointer ${
                  isWinningCell
                    ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/40 text-amber-300 animate-pulse'
                    : val === 'X'
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-md shadow-rose-500/20'
                    : val === 'O'
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {val}
              </motion.button>
            );
          })}
        </div>

        {/* Quick Cyber Taunts / Emotes */}
        <div className="flex items-center gap-2 mt-8">
          <span className="text-xs text-white/40 font-mono">Taunt:</span>
          {['🔥 Nice Move!', '⚡ Calculate That!', '🤖 Good Game!', '👑 Rematch!'].map((msg) => (
            <button
              key={msg}
              onClick={() => sendEmote(msg)}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] text-white/80 transition-all cursor-pointer"
            >
              {msg}
            </button>
          ))}
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
              <h2 className="text-xl font-black text-white mb-1">Custom Tic Tac Toe Room</h2>
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
                    placeholder="e.g. TTT-482910"
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

export default function TicTacToePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <TicTacToeContent />
    </Suspense>
  );
}
