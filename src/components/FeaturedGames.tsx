'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import GameCard from './GameCard';
import { GAMES } from '@/lib/data';

export default function FeaturedGames() {
  const router = useRouter();
  return (
    <section id="games" className="relative py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-violet-300 text-xs font-bold tracking-widest uppercase">Featured Games</span>
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            ENTER THE{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              GAMEVERSE
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Choose your next adventure.
          </p>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/games')}
            className="px-8 py-3.5 rounded-2xl border border-white/10 hover:border-violet-500/40 bg-white/3 hover:bg-violet-500/10 text-white/70 hover:text-white font-semibold text-sm transition-all cursor-pointer"
          >
            View All Games →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
