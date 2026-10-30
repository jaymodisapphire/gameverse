'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { GAMES } from '@/lib/data';

export default function RecentlyPlayed() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  const recentGames = GAMES.filter(g => g.lastPlayed).sort((a, b) => {
    const order = ['Just now', '2 hours ago', '3 hours ago', '5 hours ago', '1 day ago'];
    return order.indexOf(a.lastPlayed ?? '') - order.indexOf(b.lastPlayed ?? '');
  });

  return (
    <section className="relative py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/8 mb-3">
              <Clock className="w-3 h-3 text-white/40" />
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Recent Activity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              RECENTLY{' '}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                PLAYED
              </span>
            </h2>
          </div>

          {/* Scroll Buttons */}
          <div className="hidden sm:flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-none pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recentGames.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              onClick={() => router.push(game.route)}
              className="flex-none w-64 rounded-2xl overflow-hidden border border-white/8 hover:border-white/20 transition-all duration-300 cursor-pointer group"
              style={{ background: 'linear-gradient(135deg, rgba(15,15,25,0.95), rgba(20,20,40,0.9))' }}
            >
              {/* Game Visual */}
              <div className={`h-36 bg-gradient-to-br ${game.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl drop-shadow-2xl">{game.emoji}</span>
                </div>
                <div className="absolute inset-0 bg-black/20" />
                {/* Last played badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <Clock className="w-3 h-3 text-white/60" />
                  <span className="text-white/60 text-[10px] font-semibold">{game.lastPlayed}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-bold text-sm mb-3">{game.title}</h3>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(game.route);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer"
                  style={{ background: `linear-gradient(135deg, ${game.accentColor}cc, ${game.accentColor}77)` }}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Again
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
