'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 15 + 5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase('done');
            setTimeout(onComplete, 600);
          }, 200);
          return 100;
        }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase === 'loading' && (
        <motion.div
          key="loader"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-radial from-violet-950/30 via-black to-black" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px]" />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="relative mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-violet-500"
            />
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12 text-center"
          >
            <div className="text-3xl font-black tracking-wider mb-1">
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">GAME</span>
              <span className="text-white">VERSE</span>
            </div>
            <p className="text-white/30 text-sm tracking-widest uppercase">Loading your universe...</p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 280 }}
            transition={{ delay: 0.4 }}
            className="h-1 rounded-full bg-white/5 overflow-hidden"
          >
            <motion.div
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-100"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-white/20 text-xs font-mono"
          >
            {Math.round(progress)}%
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
