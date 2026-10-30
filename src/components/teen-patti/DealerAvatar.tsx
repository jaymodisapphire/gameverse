'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { DealerState } from '@/lib/teen-patti/types';

interface DealerAvatarProps {
  dealer: DealerState;
  onToggleSound: () => void;
  onToggleAnimations: () => void;
}

export function DealerAvatar({ dealer, onToggleSound, onToggleAnimations }: DealerAvatarProps) {
  const { message, emotion, isMuted, animationsEnabled } = dealer;

  return (
    <div className="relative flex flex-col items-center justify-center select-none z-20">
      {/* Dealer Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={animationsEnabled ? { opacity: 0, y: 10, scale: 0.9 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={animationsEnabled ? { opacity: 0, y: -6, scale: 0.95 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2 max-w-xs sm:max-w-md px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-950/90 via-black/90 to-indigo-950/90 border border-violet-500/40 backdrop-blur-xl shadow-lg shadow-violet-950/50 flex items-center gap-2.5 text-center relative"
        >
          {/* Subtle Speech Bubble Tail */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-violet-950 border-r border-b border-violet-500/40 rotate-45" />

          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-violet-200">
            {message}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dealer Graphic & Stage */}
      <div className="relative flex items-center justify-center">
        {/* Glow Ring Behind Dealer */}
        <div
          className={`absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full blur-xl transition-all duration-700 pointer-events-none ${
            emotion === 'winner'
              ? 'bg-amber-500/30'
              : emotion === 'showdown'
              ? 'bg-rose-500/30'
              : 'bg-violet-600/25'
          }`}
        />

        {/* Dealer Avatar SVG Illustration Container */}
        <motion.div
          animate={
            animationsEnabled
              ? {
                  y: emotion === 'dealing' ? [0, -3, 0] : [0, -2, 0],
                }
              : {}
          }
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-b from-amber-400/80 via-violet-500/60 to-indigo-900 border-2 border-violet-400/50 shadow-2xl flex items-center justify-center overflow-hidden"
        >
          {/* Custom SVG Stylized Cyber-Casino Female Dealer: "Aria" */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd2b8" />
                <stop offset="100%" stopColor="#f7b794" />
              </linearGradient>
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="goldTie" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Background Halo */}
            <circle cx="50" cy="50" r="48" fill="#0b0b1a" />

            {/* Suit & Shoulders */}
            <path d="M 20 100 Q 25 72 40 68 L 50 82 L 60 68 Q 75 72 80 100 Z" fill="url(#suitGrad)" />
            <path d="M 38 68 L 50 85 L 62 68 L 50 64 Z" fill="#ffffff" />
            <polygon points="48,68 52,68 50,78" fill="url(#goldTie)" />

            {/* Neck */}
            <rect x="44" y="52" width="12" height="15" fill="url(#skinGrad)" rx="3" />

            {/* Head */}
            <ellipse cx="50" cy="42" rx="17" ry="20" fill="url(#skinGrad)" />

            {/* Face Details */}
            {/* Eyes */}
            <ellipse cx="44" cy="40" rx="2.5" ry="3" fill="#1e1b4b" />
            <ellipse cx="56" cy="40" rx="2.5" ry="3" fill="#1e1b4b" />
            <circle cx="44.8" cy="39.2" r="0.8" fill="#ffffff" />
            <circle cx="56.8" cy="39.2" r="0.8" fill="#ffffff" />

            {/* Cyber Visor / Brow Accents */}
            <path d="M 40 35 Q 44 33 48 35" stroke="#a855f7" strokeWidth="1.2" fill="none" />
            <path d="M 52 35 Q 56 33 60 35" stroke="#a855f7" strokeWidth="1.2" fill="none" />

            {/* Smile */}
            <path d="M 46 51 Q 50 54 54 51" stroke="#e11d48" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Hair with Cyber Neon Highlights */}
            <path
              d="M 30 42 C 28 22 72 22 70 42 C 72 48 70 60 66 65 C 64 56 64 45 62 38 C 55 32 45 32 38 38 C 36 45 36 56 34 65 C 30 60 28 48 30 42 Z"
              fill="url(#hairGrad)"
            />

            {/* Bangs */}
            <path d="M 36 32 Q 46 36 48 42 Q 52 32 64 33 Q 50 24 36 32 Z" fill="#7c3aed" />

            {/* Dealer VIP Headset Microphone */}
            <path d="M 66 40 Q 68 48 64 54 L 56 56" stroke="#fbbf24" strokeWidth="1.4" fill="none" />
            <circle cx="55" cy="56" r="2" fill="#fbbf24" />
            <rect x="65" y="37" width="3" height="7" rx="1.5" fill="#f59e0b" />
          </svg>

          {/* Online Dealer Badge */}
          <div className="absolute bottom-0 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
        </motion.div>

        {/* Dealer Name Pill */}
        <div className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full bg-black/90 border border-violet-500/40 text-[10px] font-bold text-amber-400 tracking-wider flex items-center gap-1 shadow-md">
          <span>ARIA</span>
          <span className="text-[8px] text-violet-300 font-mono">• AI DEALER</span>
        </div>
      </div>

      {/* Floating Dealer Controls Bar */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
              : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title={isMuted ? 'Unmute Dealer Audio' : 'Mute Dealer Audio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-violet-400" />}
          <span className="text-[10px] hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
        </button>

        <button
          onClick={onToggleAnimations}
          className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
            !animationsEnabled
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title={animationsEnabled ? 'Disable Dealer Animations' : 'Enable Dealer Animations'}
        >
          {!animationsEnabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="text-[10px] hidden sm:inline">{animationsEnabled ? 'Motion On' : 'Reduced'}</span>
        </button>
      </div>
    </div>
  );
}
