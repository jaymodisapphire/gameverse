'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/lib/teen-patti/types';
import { SUIT_SYMBOLS, SUIT_COLORS, getRankLabel } from '@/lib/teen-patti/engine';

interface CardViewProps {
  card?: Card;
  isFaceDown?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  fanAngle?: number;
  elevateOnHover?: boolean;
}

export function CardView({
  card,
  isFaceDown = false,
  className = '',
  size = 'md',
  animated = true,
  fanAngle = 0,
  elevateOnHover = true,
}: CardViewProps) {
  const sizeClasses = {
    sm: 'w-10 h-15 text-[11px] rounded-lg',
    md: 'w-14 h-20 text-xs rounded-xl',
    lg: 'w-20 h-28 text-sm rounded-2xl',
    xl: 'w-24 h-34 text-base rounded-2xl',
  }[size];

  // Face Down 3D Card
  if (isFaceDown || !card) {
    return (
      <motion.div
        initial={animated ? { rotateY: 180, scale: 0.85, opacity: 0 } : false}
        animate={{ rotateY: 0, scale: 1, opacity: 1, rotate: fanAngle }}
        whileHover={elevateOnHover ? { y: -8, scale: 1.05, zIndex: 30 } : undefined}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          perspective: 800,
          transformStyle: 'preserve-3d',
          boxShadow: '0 10px 25px -4px rgba(0,0,0,0.8), 0 0 12px rgba(139,92,246,0.3)',
        }}
        className={`relative ${sizeClasses} ${className} bg-gradient-to-br from-[#130d2e] via-[#21114b] to-[#0d0722] border-2 border-violet-400/50 flex items-center justify-center overflow-hidden flex-shrink-0 select-none cursor-pointer`}
      >
        {/* Holographic Border Rim */}
        <div className="absolute inset-1 rounded-lg border border-amber-400/40 bg-[radial-gradient(#a855f733_1.5px,transparent_1.5px)] [background-size:8px_8px] flex items-center justify-center">
          {/* Cyber Gold Emblem */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 via-violet-500 to-indigo-600 p-[1px] shadow-lg shadow-violet-500/40">
            <div className="w-full h-full rounded-full bg-[#0d0722] flex items-center justify-center">
              <span className="text-[10px] font-black text-amber-300">♠</span>
            </div>
          </div>
        </div>

        {/* 3D Glass Light Sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </motion.div>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  const label = getRankLabel(card.rank);
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <motion.div
      initial={animated ? { rotateY: -90, scale: 0.85, opacity: 0 } : false}
      animate={{ rotateY: 0, scale: 1, opacity: 1, rotate: fanAngle }}
      whileHover={elevateOnHover ? { y: -12, scale: 1.08, zIndex: 40 } : undefined}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        perspective: 800,
        transformStyle: 'preserve-3d',
        boxShadow: `0 14px 28px -5px rgba(0,0,0,0.85), 0 0 15px ${isRed ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.15)'}, inset 0 1px 1px rgba(255,255,255,0.4)`,
      }}
      className={`relative ${sizeClasses} ${className} bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] border-2 border-slate-300 hover:border-amber-400 shadow-2xl flex flex-col justify-between p-1.5 flex-shrink-0 select-none transition-all cursor-pointer`}
    >
      {/* Top Left Rank & Suit */}
      <div className="flex flex-col items-center leading-none select-none" style={{ color }}>
        <span className="font-black text-xs sm:text-sm tracking-tighter drop-shadow-sm">{label}</span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>

      {/* Center 3D Suit Emblem with Gradient & Shadow */}
      <div className="self-center flex flex-col items-center justify-center my-auto">
        <span
          className="text-lg sm:text-2xl font-black drop-shadow-md transition-transform"
          style={{ color }}
        >
          {symbol}
        </span>
      </div>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <div className="flex flex-col items-center leading-none rotate-180 select-none" style={{ color }}>
        <span className="font-black text-xs sm:text-sm tracking-tighter drop-shadow-sm">{label}</span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>

      {/* Subtle Plastic Sheen / Bevel Highlight */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
    </motion.div>
  );
}
