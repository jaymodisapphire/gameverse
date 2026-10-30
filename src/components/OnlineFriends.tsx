'use client';

import { motion } from 'framer-motion';
import { UserPlus, ChevronRight, Gamepad2 } from 'lucide-react';
import { MOCK_FRIENDS } from '@/lib/data';

const AVATAR_COLORS = [
  'from-violet-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-fuchsia-500 to-purple-600',
];

export default function OnlineFriends() {
  return (
    <section id="friends" className="relative py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Header Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-bold tracking-widest uppercase">Online Now</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
              YOUR{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                SQUAD
              </span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed mb-6">
              See which friends are online and join their game or invite them to yours.
            </p>
            <div className="p-4 rounded-2xl bg-white/3 border border-white/8">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1 font-semibold">⚠️ Demo Data</p>
              <p className="text-white/40 text-xs leading-relaxed">
                Friend data shown here is for demonstration. Connect your account to see real friends.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-5 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/25 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add Friends
            </motion.button>
          </motion.div>

          {/* Friends List */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white/70 font-semibold text-sm">Friends</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    4 Online
                  </span>
                </div>
                <button className="text-white/40 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Friends */}
              <div className="divide-y divide-white/3">
                {MOCK_FRIENDS.map((friend, i) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center`}>
                        <span className="text-white font-black text-xs">{friend.avatar}</span>
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                          friend.isOnline ? 'bg-emerald-400' : 'bg-white/20'
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-semibold text-sm truncate">{friend.username}</p>
                        <span className="text-white/30 text-xs">Lv.{friend.level}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {friend.isOnline ? (
                          <>
                            <Gamepad2 className="w-3 h-3 text-violet-400" />
                            <p className="text-violet-300/80 text-xs truncate">{friend.currentGame}</p>
                          </>
                        ) : (
                          <p className="text-white/30 text-xs">Offline</p>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    {friend.isOnline && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all"
                      >
                        Invite
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
