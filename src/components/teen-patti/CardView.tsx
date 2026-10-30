'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardSuit } from '@/lib/teen-patti/types';
import { SUIT_SYMBOLS, SUIT_COLORS, getRankLabel } from '@/lib/teen-patti/engine';

interface CardViewProps {
  card?: Card;
  isFaceDown?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function CardView({
  card,
  isFaceDown = false,
  className = '',
  size = 'md',
  animated = true,
}: CardViewProps) {
  const sizeClasses = {
    sm: 'w-8 h-12 text-[10px] rounded-lg',
    md: 'w-12 h-18 text-xs rounded-xl',
    lg: 'w-16 h-24 text-sm rounded-xl',
  }[size];

  if (isFaceDown || !card) {
    return (
      <motion.div
        initial={animated ? { rotateY: 180, scale: 0.9 } : false}
        animate={{ rotateY: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`relative ${sizeClasses} ${className} bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 border-2 border-violet-400/40 shadow-xl flex items-center justify-center overflow-hidden flex-shrink-0 select-none`}
      >
        {/* Futuristic Card Back Cyber Geometric Pattern */}
        <div className="absolute inset-1 rounded-lg border border-violet-400/30 flex items-center justify-center bg-[radial-gradient(#8b5cf633_1px,transparent_1px)] [background-size:6px_6px]">
          <div className="w-4 h-4 rounded-full border border-violet-400/60 flex items-center justify-center">
            <span className="text-[8px] font-black text-violet-300">G</span>
          </div>
        </div>
      </motion.div>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  const label = getRankLabel(card.rank);

  return (
    <motion.div
      initial={animated ? { rotateY: -90, scale: 0.9 } : false}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative ${sizeClasses} ${className} bg-[#0c0d1a] border-2 border-white/20 hover:border-violet-400/60 shadow-xl flex flex-col justify-between p-1 flex-shrink-0 select-none transition-colors`}
      style={{
        boxShadow: `0 4px 15px -3px rgba(0,0,0,0.6), 0 0 10px ${color}20`,
      }}
    >
      {/* Top Left Rank & Suit */}
      <div className="flex flex-col items-center leading-none" style={{ color }}>
        <span className="font-black text-xs sm:text-sm">{label}</span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>

      {/* Center Big Suit Emblem */}
      <div className="self-center text-base sm:text-xl font-bold" style={{ color }}>
        {symbol}
      </div>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <div className="flex flex-col items-center leading-none rotate-180" style={{ color }}>
        <span className="font-black text-xs sm:text-sm">{label}</span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>
    </motion.div>
  );
}
