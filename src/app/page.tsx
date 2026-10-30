'use client';

import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturedGames from '@/components/FeaturedGames';
import QuickPlay from '@/components/QuickPlay';
import OnlineFriends from '@/components/OnlineFriends';
import GamingStatistics from '@/components/GamingStatistics';
import LeaderboardPreview from '@/components/LeaderboardPreview';
import RecentlyPlayed from '@/components/RecentlyPlayed';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen bg-black overflow-x-hidden"
    >
      <AnimatedBackground />
      <Navbar />

      <main>
        <HeroSection />

        {/* Divider */}
        <div className="h-px mx-8 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <GamingStatistics />

        <div className="h-px mx-8 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <FeaturedGames />

        <div className="h-px mx-8 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <QuickPlay />

        <div className="h-px mx-8 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <OnlineFriends />

        <div className="h-px mx-8 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <LeaderboardPreview />

        <div className="h-px mx-8 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <RecentlyPlayed />
      </main>

      <Footer />
    </motion.div>
  );
}
