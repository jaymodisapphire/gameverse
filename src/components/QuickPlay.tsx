'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  Bot,
  Zap,
  Lock,
  UserPlus,
  Hash,
  ChevronRight,
  Play,
  Swords,
  Globe,
} from 'lucide-react';

interface QuickPlayOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  accentColor: string;
  glowColor: string;
  steps: { icon: React.ElementType; label: string }[];
  cta: string;
  route: string;
}

const OPTIONS: QuickPlayOption[] = [
  {
    id: 'friends',
    title: 'Play with Friends',
    subtitle: 'Create a private room and challenge your crew',
    icon: Users,
    gradient: 'from-violet-600 to-indigo-700',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.3)',
    steps: [
      { icon: Lock, label: 'Create private room' },
      { icon: UserPlus, label: 'Invite friends' },
      { icon: Hash, label: 'Share room code' },
    ],
    cta: 'Create Room',
    route: '/games/teen-patti/create',
  },
  {
    id: 'ai',
    title: 'Play with AI',
    subtitle: 'Test your skills against intelligent bot opponents',
    icon: Bot,
    gradient: 'from-cyan-600 to-blue-700',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.3)',
    steps: [
      { icon: Play, label: 'Select your game' },
      { icon: Swords, label: 'Choose difficulty' },
      { icon: Zap, label: 'Start instantly' },
    ],
    cta: 'Play AI Match',
    route: '/games',
  },
  {
    id: 'quick',
    title: 'Quick Match',
    subtitle: 'Jump into a live public match right now',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-600',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.3)',
    steps: [
      { icon: Globe, label: 'Find public rooms' },
      { icon: Users, label: 'Auto-matchmaking' },
      { icon: Play, label: 'Join live match' },
    ],
    cta: 'Find Match',
    route: '/games/teen-patti/lobby',
  },
];

export default function QuickPlay() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="quick-play" className="relative py-24 px-4 sm:px-6">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">Quick Play</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            START PLAYING{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              INSTANTLY
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Choose how you want to play and get into the action in seconds.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OPTIONS.map((opt, i) => {
            const Icon = opt.icon;
            const isHovered = hovered === opt.id;

            return (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => setHovered(null)}
                className="group cursor-pointer"
              >
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative rounded-2xl overflow-hidden border transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,15,25,0.95), rgba(20,20,40,0.9))',
                    borderColor: isHovered ? `${opt.accentColor}50` : 'rgba(255,255,255,0.06)',
                    boxShadow: isHovered
                      ? `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${opt.glowColor}`
                      : '0 4px 24px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Gradient Accent Top */}
                  <div className={`h-1 w-full bg-gradient-to-r ${opt.gradient}`} />

                  <div className="p-7">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `linear-gradient(135deg, ${opt.accentColor}30, ${opt.accentColor}10)`, border: `1px solid ${opt.accentColor}30` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: opt.accentColor }} />
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-black text-xl mb-2">{opt.title}</h3>
                    <p className="text-white/50 text-sm mb-6 leading-relaxed">{opt.subtitle}</p>

                    {/* Steps */}
                    <div className="space-y-3 mb-7">
                      {opt.steps.map(({ icon: StepIcon, label }, si) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + si * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${opt.accentColor}15`, border: `1px solid ${opt.accentColor}25` }}
                          >
                            <StepIcon className="w-3.5 h-3.5" style={{ color: opt.accentColor }} />
                          </div>
                          <span className="text-white/60 text-sm">{label}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: `0 8px 30px ${opt.glowColor}` }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.push(opt.route)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all cursor-pointer"
                      style={{ background: `linear-gradient(135deg, ${opt.accentColor}ee, ${opt.accentColor}99)` }}
                    >
                      {opt.cta}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
