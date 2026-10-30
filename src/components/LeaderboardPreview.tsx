'use client';

import { motion } from 'framer-motion';
import { Trophy, ChevronRight, Crown, Medal, Award } from 'lucide-react';
import { LEADERBOARD } from '@/lib/data';

const RANK_STYLES = [
  {
    bg: 'from-amber-500/20 to-yellow-500/10',
    border: 'border-amber-500/30',
    icon: Crown,
    iconColor: 'text-amber-400',
    badge: 'bg-gradient-to-r from-amber-400 to-yellow-300',
    glow: 'rgba(245,158,11,0.2)',
  },
  {
    bg: 'from-slate-400/20 to-slate-500/10',
    border: 'border-slate-400/30',
    icon: Medal,
    iconColor: 'text-slate-300',
    badge: 'bg-gradient-to-r from-slate-300 to-slate-400',
    glow: 'rgba(148,163,184,0.15)',
  },
  {
    bg: 'from-orange-700/20 to-amber-700/10',
    border: 'border-orange-600/30',
    icon: Award,
    iconColor: 'text-orange-400',
    badge: 'bg-gradient-to-r from-orange-500 to-amber-600',
    glow: 'rgba(234,88,12,0.15)',
  },
];

const AVATAR_COLORS = [
  'from-amber-500 to-yellow-600',
  'from-slate-400 to-slate-600',
  'from-orange-500 to-amber-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
];

export default function LeaderboardPreview() {
  return (
    <section id="leaderboard" className="relative py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">Leaderboard</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            HALL OF{' '}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              CHAMPIONS
            </span>
          </h2>
          <p className="text-white/40 text-sm">
            ⚠️ Demo data — real rankings will show after backend integration.
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {LEADERBOARD.slice(0, 3).map((player, i) => {
            const style = RANK_STYLES[i];
            const RankIcon = style.icon;

            return (
              <motion.div
                key={player.rank}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -6 }}
                className={`relative rounded-2xl border p-6 text-center overflow-hidden transition-all duration-300 bg-gradient-to-br ${style.bg} ${style.border} cursor-pointer`}
                style={{ boxShadow: `0 8px 32px ${style.glow}` }}
              >
                {/* Rank Badge */}
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-xl ${style.badge} flex items-center justify-center`}>
                  <span className="text-black font-black text-sm">#{player.rank}</span>
                </div>

                {/* Icon */}
                <RankIcon className={`w-8 h-8 ${style.iconColor} mx-auto mb-3`} />

                {/* Avatar */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[i]} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-white font-black text-lg">{player.avatar}</span>
                </div>

                {/* Info */}
                <h3 className="text-white font-black text-lg mb-1">{player.username}</h3>
                <p className="text-white/40 text-xs mb-4">Level {player.level}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 border border-white/5 py-2 px-3">
                    <p className="text-white font-bold text-lg">{player.wins.toLocaleString()}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">Wins</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/5 py-2 px-3">
                    <p className="text-white font-bold text-lg">{player.winRate}%</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">Win Rate</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Remaining Players */}
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(15,15,25,0.8)' }}>
          {LEADERBOARD.slice(3).map((player, i) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-5 px-6 py-4 border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors group"
            >
              <span className="w-8 text-white/30 font-black text-lg text-center">#{player.rank}</span>

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[player.rank - 1]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-black text-xs">{player.avatar}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{player.username}</p>
                <p className="text-white/30 text-xs">Level {player.level}</p>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-white font-bold text-sm">{player.wins.toLocaleString()}</p>
                <p className="text-white/30 text-xs">Wins</p>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-white font-bold text-sm">{player.winRate}%</p>
                <p className="text-white/30 text-xs">Win Rate</p>
              </div>

              <div className="w-24 hidden md:block">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${player.winRate}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold text-sm hover:bg-amber-500/20 transition-all"
          >
            <Trophy className="w-4 h-4" />
            View Full Leaderboard
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
