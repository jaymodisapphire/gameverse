'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { STATS } from '@/lib/data';

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function GamingStatistics() {
  return (
    <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <span className="text-blue-300 text-xs font-bold tracking-widest uppercase">⚠️ Demo Statistics</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            THE{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              NUMBERS
            </span>
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Demo values shown. Real statistics will display when backend is connected.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl overflow-hidden border border-white/8 hover:border-violet-500/30 transition-all duration-300 group"
              style={{ background: 'linear-gradient(135deg, rgba(15,15,25,0.9), rgba(20,20,45,0.8))' }}
            >
              {/* Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-violet-500/5 to-indigo-500/5" />

              <div className="p-6 text-center">
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-3xl sm:text-4xl font-black text-white mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>

              {/* Bottom accent */}
              <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
