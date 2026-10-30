'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Bot, Users, Trophy, Sparkles, Volume2, VolumeX } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { gameAudio } from '@/lib/games/audio';

type SquareValue = 'X' | 'O' | null;

export default function TicTacToePage() {
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [mode, setMode] = useState<'ai' | 'pvp'>('ai');
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('hard');
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });

  const calculateWinner = (squares: SquareValue[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    if (squares.every((sq) => sq !== null)) {
      return { winner: 'Tie' as const, line: null };
    }
    return null;
  };

  const winInfo = calculateWinner(board);

  const getBestMove = (squares: SquareValue[]): number => {
    if (difficulty === 'easy') {
      const open = squares.map((v, i) => (v === null ? i : null)).filter((v): v is number => v !== null);
      return open[Math.floor(Math.random() * open.length)];
    }

    // Minimax / Smart AI
    // 1. Check if AI can win
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const copy = [...squares];
        copy[i] = 'O';
        if (calculateWinner(copy)?.winner === 'O') return i;
      }
    }
    // 2. Block player X
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const copy = [...squares];
        copy[i] = 'X';
        if (calculateWinner(copy)?.winner === 'X') return i;
      }
    }
    // 3. Take center
    if (!squares[4]) return 4;
    // 4. Take corners
    const corners = [0, 2, 6, 8].filter((i) => !squares[i]);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    // 5. Any open
    const open = squares.map((v, i) => (v === null ? i : null)).filter((v): v is number => v !== null);
    return open[0];
  };

  const handleClick = (index: number) => {
    if (board[index] || winInfo) return;

    gameAudio.playClick();
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const result = calculateWinner(newBoard);
    if (result) {
      if (result.winner === 'X') {
        gameAudio.playVictory();
        setScores((s) => ({ ...s, x: s.x + 1 }));
      } else if (result.winner === 'O') {
        gameAudio.playGameOver();
        setScores((s) => ({ ...s, o: s.o + 1 }));
      } else {
        setScores((s) => ({ ...s, ties: s.ties + 1 }));
      }
      return;
    }

    if (mode === 'ai' && isXNext) {
      setIsXNext(false);
      setTimeout(() => {
        const aiMove = getBestMove(newBoard);
        if (aiMove !== undefined) {
          gameAudio.playLaser();
          newBoard[aiMove] = 'O';
          setBoard([...newBoard]);
          const aiResult = calculateWinner(newBoard);
          if (aiResult) {
            if (aiResult.winner === 'O') {
              gameAudio.playGameOver();
              setScores((s) => ({ ...s, o: s.o + 1 }));
            } else if (aiResult.winner === 'Tie') {
              setScores((s) => ({ ...s, ties: s.ties + 1 }));
            }
          }
          setIsXNext(true);
        }
      }, 400);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const handleReset = () => {
    gameAudio.playClick();
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden flex flex-col justify-between">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-28 pb-16 w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/games"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Games Portal</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMode('ai');
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'ai' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-white/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>VS Cyber AI</span>
            </button>
            <button
              onClick={() => {
                setMode('pvp');
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'pvp' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-white/5 text-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2 Players</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            NEON{' '}
            <span className="bg-gradient-to-r from-rose-500 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              TIC TAC TOE
            </span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm">
            {winInfo
              ? winInfo.winner === 'Tie'
                ? 'Game ended in a draw!'
                : `Player ${winInfo.winner} wins!`
              : `Current Turn: Player ${isXNext ? 'X' : 'O'}`}
          </p>
        </div>

        {/* Score Board */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8 text-center font-mono">
          <div className="p-3 rounded-2xl bg-white/5 border border-rose-500/30">
            <span className="text-[10px] text-rose-300 uppercase block">Player X</span>
            <span className="text-2xl font-black text-rose-400">{scores.x}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-white/40 uppercase block">Ties</span>
            <span className="text-2xl font-black text-white/60">{scores.ties}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-cyan-500/30">
            <span className="text-[10px] text-cyan-300 uppercase block">
              {mode === 'ai' ? 'Cyber AI (O)' : 'Player O'}
            </span>
            <span className="text-2xl font-black text-cyan-400">{scores.o}</span>
          </div>
        </div>

        {/* 3x3 Interactive Neon Grid */}
        <div className="max-w-[320px] sm:max-w-[360px] mx-auto p-4 rounded-3xl bg-[#0c0d1a] border-2 border-white/10 shadow-2xl relative">
          <div className="grid grid-cols-3 gap-3">
            {board.map((val, idx) => {
              const isWinningSquare = winInfo?.line?.includes(idx);
              return (
                <motion.button
                  key={idx}
                  whileHover={!val && !winInfo ? { scale: 1.05 } : {}}
                  whileTap={!val && !winInfo ? { scale: 0.95 } : {}}
                  onClick={() => handleClick(idx)}
                  className={`h-24 sm:h-28 rounded-2xl flex items-center justify-center font-black text-4xl sm:text-5xl transition-all cursor-pointer select-none ${
                    isWinningSquare
                      ? 'bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                      : val
                      ? 'bg-white/5 border border-white/15'
                      : 'bg-white/3 hover:bg-white/8 border border-white/10'
                  }`}
                >
                  {val === 'X' && (
                    <motion.span
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]"
                    >
                      ✕
                    </motion.span>
                  )}
                  {val === 'O' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]"
                    >
                      ○
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Reset / New Game Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 mx-auto transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Grid</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
