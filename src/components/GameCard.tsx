'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users, Cpu, Play, ChevronRight } from 'lucide-react';
import type { Game } from '@/types';

interface GameCardProps {
  game: Game;
  index: number;
}

const GAME_VISUALS: Record<string, { pattern: string; icon: string }> = {
  ludo: {
    pattern: `
      <rect x="30" y="30" width="140" height="140" rx="16" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" stroke-width="1.5"/>
      <rect x="55" y="55" width="40" height="40" rx="6" fill="rgba(239,68,68,0.8)"/>
      <rect x="105" y="55" width="40" height="40" rx="6" fill="rgba(34,197,94,0.8)"/>
      <rect x="55" y="105" width="40" height="40" rx="6" fill="rgba(234,179,8,0.8)"/>
      <rect x="105" y="105" width="40" height="40" rx="6" fill="rgba(59,130,246,0.8)"/>
      <circle cx="100" cy="100" r="18" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <circle cx="75" cy="75" r="7" fill="white" opacity="0.9"/>
      <circle cx="125" cy="75" r="7" fill="white" opacity="0.9"/>
      <circle cx="75" cy="125" r="7" fill="white" opacity="0.9"/>
      <circle cx="125" cy="125" r="7" fill="white" opacity="0.9"/>
    `,
    icon: '🎲',
  },
  'snake-ladder': {
    pattern: `
      <rect x="30" y="30" width="140" height="140" rx="8" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" stroke-width="1.5"/>
      <line x1="50" y1="150" x2="150" y2="50" stroke="rgba(16,185,129,0.6)" stroke-width="4" stroke-linecap="round"/>
      <line x1="80" y1="150" x2="50" y2="80" stroke="rgba(239,68,68,0.7)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="50" cy="80" r="8" fill="rgba(239,68,68,0.9)"/>
      <ellipse cx="82" cy="152" rx="10" ry="6" fill="rgba(239,68,68,0.7)"/>
      <circle cx="100" cy="165" r="5" fill="rgba(59,130,246,0.9)"/>
      <circle cx="120" cy="165" r="5" fill="rgba(234,179,8,0.9)"/>
    `,
    icon: '🐍',
  },
  'tic-tac-toe': {
    pattern: `
      <line x1="87" y1="40" x2="87" y2="160" stroke="rgba(244,63,94,0.5)" stroke-width="3" stroke-linecap="round"/>
      <line x1="113" y1="40" x2="113" y2="160" stroke="rgba(244,63,94,0.5)" stroke-width="3" stroke-linecap="round"/>
      <line x1="40" y1="87" x2="160" y2="87" stroke="rgba(244,63,94,0.5)" stroke-width="3" stroke-linecap="round"/>
      <line x1="40" y1="113" x2="160" y2="113" stroke="rgba(244,63,94,0.5)" stroke-width="3" stroke-linecap="round"/>
      <line x1="52" y1="52" x2="74" y2="74" stroke="rgba(244,63,94,0.9)" stroke-width="4" stroke-linecap="round"/>
      <line x1="74" y1="52" x2="52" y2="74" stroke="rgba(244,63,94,0.9)" stroke-width="4" stroke-linecap="round"/>
      <circle cx="126" cy="63" r="10" fill="none" stroke="rgba(59,130,246,0.9)" stroke-width="4"/>
      <circle cx="63" cy="126" r="10" fill="none" stroke="rgba(59,130,246,0.9)" stroke-width="4"/>
      <line x1="104" y1="126" x2="148" y2="126" stroke="rgba(234,179,8,0.9)" stroke-width="4" stroke-linecap="round"/>
    `,
    icon: '❌',
  },
  'card-games': {
    pattern: `
      <rect x="45" y="50" width="55" height="80" rx="8" fill="rgba(245,158,11,0.2)" stroke="rgba(245,158,11,0.5)" stroke-width="1.5" transform="rotate(-10 72 90)"/>
      <rect x="60" y="45" width="55" height="80" rx="8" fill="rgba(245,158,11,0.4)" stroke="rgba(245,158,11,0.6)" stroke-width="1.5" transform="rotate(-3 87 85)"/>
      <rect x="75" y="42" width="55" height="80" rx="8" fill="rgba(245,158,11,0.8)" stroke="rgba(245,158,11,0.9)" stroke-width="1.5"/>
      <text x="83" y="72" font-size="20" fill="rgba(220,38,38,0.9)">♥</text>
      <text x="83" y="98" font-size="16" font-weight="bold" fill="white" font-family="serif">A</text>
      <text x="108" y="108" font-size="20" fill="rgba(220,38,38,0.9)" transform="rotate(180 118 108)">♥</text>
    `,
    icon: '🃏',
  },
  racing: {
    pattern: `
      <rect x="30" y="30" width="140" height="140" rx="12" fill="rgba(59,130,246,0.1)"/>
      <ellipse cx="100" cy="100" rx="60" ry="45" fill="none" stroke="rgba(59,130,246,0.3)" stroke-width="10" stroke-dasharray="8 4"/>
      <path d="M70 105 L90 95 L110 105 L130 100" stroke="rgba(234,179,8,0.8)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="60" y="90" width="30" height="16" rx="4" fill="rgba(239,68,68,0.9)"/>
      <circle cx="65" cy="110" r="5" fill="rgba(30,30,30,0.9)" stroke="rgba(100,100,100,0.6)" stroke-width="1.5"/>
      <circle cx="85" cy="110" r="5" fill="rgba(30,30,30,0.9)" stroke="rgba(100,100,100,0.6)" stroke-width="1.5"/>
      <rect x="88" y="92" width="25" height="14" rx="3" fill="rgba(59,130,246,0.8)"/>
      <circle cx="93" cy="108" r="4" fill="rgba(30,30,30,0.9)" stroke="rgba(100,100,100,0.6)" stroke-width="1.5"/>
      <circle cx="108" cy="108" r="4" fill="rgba(30,30,30,0.9)" stroke="rgba(100,100,100,0.6)" stroke-width="1.5"/>
    `,
    icon: '🏎️',
  },
};

export default function GameCard({ game, index }: GameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-80, 80], [10, -10]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-80, 80], [-10, 10]), { stiffness: 200, damping: 20 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  const visual = GAME_VISUALS[game.id] || GAME_VISUALS['ludo'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className="relative group cursor-pointer rounded-2xl overflow-hidden"
    >
      {/* Card Body */}
      <div
        className={`relative h-80 rounded-2xl border transition-all duration-300 overflow-hidden ${
          hovered
            ? 'border-white/25 shadow-2xl'
            : 'border-white/8'
        }`}
        style={{
          background: `linear-gradient(135deg, rgba(15,15,25,0.95), rgba(20,20,40,0.9))`,
          boxShadow: hovered
            ? `0 30px 60px rgba(0,0,0,0.5), 0 0 40px ${game.accentColor}30, inset 0 1px 0 rgba(255,255,255,0.05)`
            : `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
      >
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

        {/* Glow Border */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `inset 0 0 30px ${game.accentColor}20` }}
        />

        {/* SVG Artwork */}
        <div className="absolute top-0 right-0 w-48 h-48 opacity-70 group-hover:opacity-90 transition-opacity duration-300">
          <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id={`glow-${game.id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g filter={`url(#glow-${game.id})`} dangerouslySetInnerHTML={{ __html: visual.pattern }} />
          </svg>
        </div>

        {/* Content */}
        <div className="absolute inset-0 p-5 flex flex-col justify-end" style={{ transform: 'translateZ(20px)' }}>
          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {game.hasMultiplayer && (
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                Multiplayer
              </span>
            )}
            {game.hasAI && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                AI
              </span>
            )}
          </div>

          {/* Emoji */}
          <div className="text-4xl mb-2 drop-shadow-lg">{visual.icon}</div>

          {/* Title */}
          <h3 className="text-white font-black text-xl leading-tight mb-1">{game.title}</h3>

          {/* Description */}
          <p className="text-white/50 text-xs leading-relaxed mb-3 line-clamp-2">{game.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white/40 text-xs">Max {game.maxPlayers}</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(game.route);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${game.accentColor}dd, ${game.accentColor}88)` }}
            >
              <Play className="w-3 h-3 fill-current" />
              Play Now
            </motion.button>
          </div>
        </div>

        {/* Animated Gradient Bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 opacity-60"
          style={{ background: `linear-gradient(to top, ${game.accentColor}40, transparent)` }}
        />
      </div>
    </motion.div>
  );
}
