'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChipStack3DProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ChipStack3D({
  amount,
  size = 'md',
  showLabel = true,
  animated = true,
  className = '',
}: ChipStack3DProps) {
  // Determine chip colors and count based on amount
  const chipColor =
    amount >= 100000
      ? { bg: 'from-amber-400 via-yellow-500 to-amber-600', ring: 'border-yellow-200', text: 'text-amber-950', glow: '#f59e0b' }
      : amount >= 25000
      ? { bg: 'from-purple-500 via-indigo-600 to-violet-700', ring: 'border-purple-200', text: 'text-white', glow: '#a855f7' }
      : amount >= 5000
      ? { bg: 'from-rose-500 via-red-600 to-rose-700', ring: 'border-rose-200', text: 'text-white', glow: '#f43f5e' }
      : { bg: 'from-cyan-400 via-teal-500 to-cyan-600', ring: 'border-cyan-200', text: 'text-cyan-950', glow: '#06b6d4' };

  const heightCount = Math.min(5, Math.max(2, Math.floor(Math.log10(Math.max(1, amount)))));

  const sizeStyles = {
    sm: { w: 'w-7', h: 'h-3.5', text: 'text-[9px]' },
    md: { w: 'w-9', h: 'h-4.5', text: 'text-[10px]' },
    lg: { w: 'w-12', h: 'h-6', text: 'text-xs' },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Stack of Physical Poker Chips */}
      <motion.div
        initial={animated ? { scale: 0.6, y: -20, opacity: 0 } : false}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="relative flex flex-col items-center cursor-pointer"
        style={{
          perspective: 600,
          filter: `drop-shadow(0 6px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 8px ${chipColor.glow}40)`,
        }}
      >
        {/* Render stacked layers of chips */}
        {Array.from({ length: heightCount }).map((_, i) => (
          <div
            key={i}
            className={`${sizeStyles.w} ${sizeStyles.h} rounded-full bg-gradient-to-r ${chipColor.bg} border-2 ${chipColor.ring} shadow-md flex items-center justify-center -mt-2.5 transition-transform hover:scale-105`}
            style={{
              transform: `rotateX(48deg) translateZ(${i * 4}px)`,
              boxShadow: `0 3px 6px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.6)`,
            }}
          >
            {/* Chip Inner Pattern / Ridges */}
            <div className="w-3/4 h-3/4 rounded-full border border-dashed border-white/60 flex items-center justify-center">
              <span className={`font-black ${sizeStyles.text} ${chipColor.text} scale-75`}>★</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Label under or above the stack */}
      {showLabel && (
        <span className="mt-1 font-mono text-[10px] sm:text-xs font-black text-amber-300 bg-black/75 px-2 py-0.5 rounded-full border border-amber-400/30 backdrop-blur-sm shadow-md">
          🪙 {amount.toLocaleString()}
        </span>
      )}
    </div>
  );
}
