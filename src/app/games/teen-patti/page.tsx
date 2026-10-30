'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Trophy,
  Users,
  Coins,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Play,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CardView } from '@/components/teen-patti/CardView';

const HAND_RANKINGS_CHART = [
  {
    tier: 'Trail / Trio',
    description: 'Three cards of the same rank. A-A-A is highest.',
    example: [
      { suit: 'spades' as const, rank: 14 },
      { suit: 'hearts' as const, rank: 14 },
      { suit: 'diamonds' as const, rank: 14 },
    ],
    badge: 'RANK #1 (HIGHEST)',
    color: '#fbbf24',
  },
  {
    tier: 'Pure Sequence',
    description: 'Three consecutive cards of the same suit. A-K-Q is highest, followed by A-2-3.',
    example: [
      { suit: 'hearts' as const, rank: 14 },
      { suit: 'hearts' as const, rank: 13 },
      { suit: 'hearts' as const, rank: 12 },
    ],
    badge: 'RANK #2',
    color: '#8b5cf6',
  },
  {
    tier: 'Sequence / Straight',
    description: 'Three consecutive cards in mixed suits. A-K-Q, A-2-3, down to 4-3-2.',
    example: [
      { suit: 'spades' as const, rank: 13 },
      { suit: 'diamonds' as const, rank: 12 },
      { suit: 'clubs' as const, rank: 11 },
    ],
    badge: 'RANK #3',
    color: '#38bdf8',
  },
  {
    tier: 'Color / Flush',
    description: 'Three cards of the same suit that are not in sequence.',
    example: [
      { suit: 'diamonds' as const, rank: 14 },
      { suit: 'diamonds' as const, rank: 9 },
      { suit: 'diamonds' as const, rank: 4 },
    ],
    badge: 'RANK #4',
    color: '#10b981',
  },
  {
    tier: 'Pair',
    description: 'Two cards of equal rank + 1 kicker card.',
    example: [
      { suit: 'clubs' as const, rank: 10 },
      { suit: 'hearts' as const, rank: 10 },
      { suit: 'spades' as const, rank: 7 },
    ],
    badge: 'RANK #5',
    color: '#f43f5e',
  },
  {
    tier: 'High Card',
    description: 'Three unmatched cards evaluated by highest rank card down.',
    example: [
      { suit: 'spades' as const, rank: 14 },
      { suit: 'clubs' as const, rank: 8 },
      { suit: 'diamonds' as const, rank: 3 },
    ],
    badge: 'RANK #6',
    color: '#94a3b8',
  },
];

export default function TeenPattiLandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      {/* Hero Ambient Glows */}
      <div className="absolute top-20 left-1/4 w-[700px] h-[450px] rounded-full bg-emerald-600/15 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[600px] h-[500px] rounded-full bg-amber-600/10 blur-[150px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-violet-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Multiplayer 3 Patti • Live Virtual Dealer</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 leading-none">
            TEEN PATTI{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
              ROYALE
            </span>
          </h1>

          <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Experience India&apos;s favorite 3-card poker game directly in your browser.
            Play online with friends, challenge live tables, and test your wits against Aria, our intelligent virtual dealer.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/games/teen-patti/lobby"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enter Game Lobby</span>
            </Link>

            <Link
              href="/games/teen-patti/create"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Private Room</span>
            </Link>
          </div>

          {/* 100,000 Chips Badge */}
          <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Every player receives <strong>100,000 Free Virtual Starting Chips</strong> upon registration</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="p-6 rounded-3xl bg-white/3 border border-white/8 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl mb-4">
              👩‍💼
            </div>
            <h3 className="text-lg font-black text-white mb-2">Aria: Virtual AI Dealer</h3>
            <p className="text-white/50 text-xs leading-relaxed">
              Experience responsive card-dealing animations, spoken game updates, and real-time turn guidance from our friendly virtual dealer.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/3 border border-white/8 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center text-xl mb-4">
              🃏
            </div>
            <h3 className="text-lg font-black text-white mb-2">Blind & Chaal Play</h3>
            <p className="text-white/50 text-xs leading-relaxed">
              Authentic Indian Teen Patti stakes: play blind to double the stakes on opponents, or peek at your cards to play chaal with confidence.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/3 border border-white/8 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl mb-4">
              🛡️
            </div>
            <h3 className="text-lg font-black text-white mb-2">Fair & Secure Deal</h3>
            <p className="text-white/50 text-xs leading-relaxed">
              Cryptographic card shuffling and strict Row Level Security. Hidden cards are never leaked to the browser until showdown.
            </p>
          </div>
        </div>

        {/* Hand Rankings Section */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              OFFICIAL 3 PATTI HAND RANKINGS
            </h2>
            <p className="text-white/40 text-xs sm:text-sm">
              Hands are ranked from highest to lowest. Learn the card combinations to conquer the table.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {HAND_RANKINGS_CHART.map((h, i) => (
              <div
                key={h.tier}
                className="p-5 rounded-3xl bg-white/3 border border-white/8 flex flex-col justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,16,28,0.9), rgba(24,20,40,0.85))',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${h.color}20`, color: h.color }}
                    >
                      {h.badge}
                    </span>
                    <span className="text-white/30 text-xs font-mono font-bold">#{i + 1}</span>
                  </div>

                  <h3 className="text-lg font-black text-white mb-1">{h.tier}</h3>
                  <p className="text-white/50 text-xs leading-relaxed mb-4">{h.description}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  {h.example.map((c, idx) => (
                    <CardView key={idx} card={c} size="sm" animated={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className="rounded-3xl border border-amber-500/40 p-8 sm:p-12 text-center relative overflow-hidden backdrop-blur-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(25,20,45,0.95), rgba(15,12,30,0.9))',
          }}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            READY TO TAKE YOUR SEAT?
          </h2>
          <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
            Join public tables or create a private game room with friends right now.
          </p>
          <Link
            href="/games/teen-patti/lobby"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all"
          >
            <span>Launch Lobby Browser</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
