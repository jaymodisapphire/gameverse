'use client';

import { motion } from 'framer-motion';
import { Gamepad2, MessageCircle, Share2, Video, Radio, Code2, Mail } from 'lucide-react';

const FOOTER_LINKS = {
  Platform: ['About', 'Games', 'Community', 'Tournament', 'Rankings'],
  Support: ['Help Center', 'Contact Us', 'Status', 'Feedback', 'Roadmap'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
};

const SOCIAL = [
  { icon: MessageCircle, label: 'Discord', color: 'hover:text-indigo-400' },
  { icon: Share2, label: 'Twitter / X', color: 'hover:text-sky-400' },
  { icon: Video, label: 'YouTube', color: 'hover:text-red-400' },
  { icon: Radio, label: 'Twitch', color: 'hover:text-violet-400' },
  { icon: Code2, label: 'GitHub', color: 'hover:text-white' },
  { icon: Mail, label: 'Email', color: 'hover:text-emerald-400' },
];

export default function Footer() {
  return (
    <footer className="relative pt-20 pb-8 px-4 sm:px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        {/* Animated orbs */}
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-violet-900/20 blur-[80px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-indigo-900/20 blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">GAME</span>
                <span className="text-xl font-black tracking-wider text-white">VERSE</span>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xs">
              The ultimate multiplayer gaming platform. Challenge friends, defeat AI opponents, and climb the leaderboards.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 flex-wrap">
              {SOCIAL.map(({ icon: Icon, label, color }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-white/40 ${color} transition-all`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/40 hover:text-white/80 text-sm transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 mb-12 flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="flex-1">
            <h4 className="text-white font-bold text-base mb-1">Stay in the Game</h4>
            <p className="text-white/40 text-sm">Get updates on new games, tournaments, and features.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 sm:w-56 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-violet-500/50 transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-500/20"
            >
              Subscribe
            </motion.button>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
          <p className="text-white/25 text-xs">
            © 2026 GameVerse. All rights reserved. Built for gamers, by gamers.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400/60 text-xs font-semibold">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
