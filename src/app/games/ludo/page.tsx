'use client';

import React, { useState } from 'react';
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
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { gameAudio } from '@/lib/games/audio';

type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

interface Pawn {
  id: number;
  color: PlayerColor;
  step: number; // -1 = in base, 0..50 = track, 51..56 = home stretch, 57 = finished
}

const COLOR_CONFIG: Record<PlayerColor, { name: string; bg: string; text: string; border: string; glow: string }> = {
  red: { name: 'Cyber Red', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500', glow: 'rgba(244,63,94,0.4)' },
  green: { name: 'Emerald Green', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', glow: 'rgba(16,185,129,0.4)' },
  yellow: { name: 'Solar Yellow', bg: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400', glow: 'rgba(251,191,36,0.4)' },
  blue: { name: 'Neon Blue', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', glow: 'rgba(6,182,212,0.4)' },
};

export default function LudoPage() {
  const [turn, setTurn] = useState<PlayerColor>('red');
  const [diceValue, setDiceValue] = useState<number>(6);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [gameLog, setGameLog] = useState<string[]>(['Welcome to Cyber Ludo! Roll dice to start.']);
  const [winner, setWinner] = useState<PlayerColor | null>(null);

  // Pawns state: 4 pawns per player
  const [pawns, setPawns] = useState<Record<PlayerColor, number[]>>({
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1],
  });

  const playerColors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

  const rollDice = () => {
    if (isRolling || hasRolled || winner) return;

    setIsRolling(true);
    gameAudio.playClick();

    // Roll animation
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 6) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        setHasRolled(true);

        const currentPawns = pawns[turn];
        const canMoveAny = currentPawns.some((step) => step !== 57 && (step !== -1 || finalValue === 6));

        if (!canMoveAny) {
          addLog(`${COLOR_CONFIG[turn].name} rolled a ${finalValue}. No legal moves.`);
          setTimeout(() => advanceTurn(), 800);
        } else {
          addLog(`${COLOR_CONFIG[turn].name} rolled a ${finalValue}. Click a pawn to advance.`);
        }
      }
    }, 80);
  };

  const advanceTurn = (extraTurn = false) => {
    setHasRolled(false);
    if (extraTurn) {
      addLog(`${COLOR_CONFIG[turn].name} rolled a 6 and earned an extra turn!`);
      return;
    }
    const idx = playerColors.indexOf(turn);
    const nextTurn = playerColors[(idx + 1) % 4];
    setTurn(nextTurn);
  };

  const movePawn = (color: PlayerColor, pawnIndex: number) => {
    if (color !== turn || !hasRolled || isRolling || winner) return;

    const currentStep = pawns[color][pawnIndex];
    if (currentStep === 57) return; // already finished

    if (currentStep === -1) {
      if (diceValue !== 6) {
        addLog(`Need a 6 to deploy pawn from base.`);
        return;
      }
      // Deploy to start
      gameAudio.playBoost();
      const updated = { ...pawns, [color]: [...pawns[color]] };
      updated[color][pawnIndex] = 0;
      setPawns(updated);
      addLog(`${COLOR_CONFIG[color].name} deployed pawn #${pawnIndex + 1} to track!`);
      advanceTurn(true);
      return;
    }

    // Normal advance
    const targetStep = currentStep + diceValue;
    if (targetStep > 57) {
      addLog(`Roll too high. Exact roll needed to enter home.`);
      return;
    }

    gameAudio.playEat();
    const updated = { ...pawns, [color]: [...pawns[color]] };
    updated[color][pawnIndex] = targetStep;
    setPawns(updated);

    if (targetStep === 57) {
      addLog(`★ ${COLOR_CONFIG[color].name} pawn #${pawnIndex + 1} reached Home!`);
      // Check win condition
      if (updated[color].every((s) => s === 57)) {
        gameAudio.playVictory();
        setWinner(color);
        addLog(`🏆 ${COLOR_CONFIG[color].name} WINS THE MATCH!`);
        return;
      }
      advanceTurn(true);
      return;
    }

    addLog(`${COLOR_CONFIG[color].name} advanced pawn #${pawnIndex + 1} to step ${targetStep}.`);
    advanceTurn(diceValue === 6);
  };

  const addLog = (msg: string) => {
    setGameLog((prev) => [msg, ...prev.slice(0, 7)]);
  };

  const handleReset = () => {
    setPawns({
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
    });
    setTurn('red');
    setWinner(null);
    setHasRolled(false);
    setGameLog(['Game reset. Roll dice to start!']);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden flex flex-col justify-between">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-28 pb-16 w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/games"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Games Portal</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 font-mono">Turn:</span>
            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${COLOR_CONFIG[turn].bg} text-black`}>
              {COLOR_CONFIG[turn].name}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            CYBER{' '}
            <span className="bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
              LUDO ARENA
            </span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm">
            4-Player Cyber Circuit. Roll a 6 to deploy from base and race to the quantum core.
          </p>
        </div>

        {/* Main Board Layout & Dice Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left / Center: Interactive Ludo Board */}
          <div className="lg:col-span-2 p-5 rounded-3xl bg-[#0c0d1a] border-2 border-white/10 shadow-2xl">
            {/* 4 Player Bases Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {playerColors.map((col) => {
                const conf = COLOR_CONFIG[col];
                const isCurrent = turn === col;
                return (
                  <div
                    key={col}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isCurrent
                        ? `${conf.border} shadow-[0_0_20px_${conf.glow}] bg-white/5`
                        : 'border-white/10 bg-white/2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-black uppercase ${conf.text}`}>
                        {conf.name} {isCurrent && '● (Active)'}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">
                        Home: {pawns[col].filter((s) => s === 57).length}/4
                      </span>
                    </div>

                    {/* 4 Pawns Controls */}
                    <div className="grid grid-cols-4 gap-2">
                      {pawns[col].map((step, pIdx) => {
                        const inBase = step === -1;
                        const isDone = step === 57;
                        const canClick = isCurrent && hasRolled && !winner;
                        return (
                          <motion.button
                            key={pIdx}
                            whileHover={canClick ? { scale: 1.1 } : {}}
                            whileTap={canClick ? { scale: 0.9 } : {}}
                            onClick={() => movePawn(col, pIdx)}
                            disabled={!canClick}
                            className={`p-2 rounded-xl flex flex-col items-center justify-center border text-center transition-all ${
                              isDone
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                                : inBase
                                ? `${conf.bg}/20 ${conf.border} text-white`
                                : `${conf.bg} text-black font-black`
                            } disabled:opacity-60 cursor-pointer`}
                          >
                            <span className="text-xs font-black">P{pIdx + 1}</span>
                            <span className="text-[9px] uppercase font-mono mt-0.5">
                              {isDone ? '★ Done' : inBase ? 'Base' : `${step}/57`}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dice Roller & Live Game Log */}
          <div className="space-y-4">
            {/* Holographic Dice */}
            <div className="p-6 rounded-3xl bg-[#0c0d1a] border border-white/10 text-center">
              <span className="text-xs text-white/50 font-bold uppercase tracking-widest block mb-4">
                Quantum Hologram Dice
              </span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={rollDice}
                disabled={isRolling || hasRolled || !!winner}
                className={`w-28 h-28 mx-auto rounded-3xl flex items-center justify-center font-black text-6xl shadow-2xl transition-all cursor-pointer border-2 ${
                  isRolling
                    ? 'animate-spin border-amber-400 bg-amber-500/20 text-amber-400'
                    : hasRolled
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : `${COLOR_CONFIG[turn].border} ${COLOR_CONFIG[turn].bg}/20 ${COLOR_CONFIG[turn].text}`
                } disabled:opacity-50`}
              >
                {diceValue}
              </motion.button>

              <div className="mt-4">
                <button
                  onClick={rollDice}
                  disabled={isRolling || hasRolled || !!winner}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-40"
                >
                  {isRolling ? 'Rolling...' : hasRolled ? 'Pick a Pawn' : 'Roll Dice'}
                </button>
              </div>
            </div>

            {/* Live Arena Log */}
            <div className="p-4 rounded-3xl bg-[#0c0d1a] border border-white/10 font-mono text-xs">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-2">
                Arena Match Feed
              </span>
              <div className="space-y-1.5 min-h-[140px]">
                {gameLog.map((log, lIdx) => (
                  <p key={lIdx} className={lIdx === 0 ? 'text-violet-300 font-bold' : 'text-white/40'}>
                    › {log}
                  </p>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Arena</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
