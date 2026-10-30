'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Search,
  Bell,
  UserCircle,
  ChevronDown,
  X,
  Menu,
  Zap,
  Users,
  Trophy,
  Compass,
  Home,
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  LogIn,
  Coins,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { getPlayerWallet } from '@/lib/wallet/wallet-service';

const NAV_LINKS = [
  { label: 'Home', href: '#home', icon: Home },
  { label: 'Explore', href: '#games', icon: Compass },
  { label: 'Teen Patti', href: '/games/teen-patti', icon: Gamepad2 },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Multiplayer', href: '#quick-play', icon: Zap },
  { label: 'Leaderboard', href: '#leaderboard', icon: Trophy },
];

export default function Navbar() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('Home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chipsBalance, setChipsBalance] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadChips() {
      if (user?.id) {
        try {
          const w = await getPlayerWallet(user.id);
          if (isMounted) setChipsBalance(w.balance);
        } catch {
          if (isMounted) setChipsBalance(100000);
        }
      } else {
        setChipsBalance(100000);
      }
    }
    loadChips();

    const handleUpdate = () => loadChips();
    window.addEventListener('gameverse:wallet_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('gameverse:wallet_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user?.id]);

  const scrollTo = (href: string, label: string) => {
    setActiveLink(label);
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const id = href.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/' + href);
      }
    } else {
      router.push(href);
    }
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    router.push('/');
  };

  const displayName = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player';
  const playerAvatar = profile?.avatar_url || 'GV';
  const playerLevel = profile?.level || 1;

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-2 mx-4 mt-3 rounded-2xl backdrop-blur-xl bg-black/60 border border-white/10 shadow-[0_8px_32px_rgba(139,92,246,0.15)]'
            : 'py-4 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('#home', 'Home')}>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                GAME
              </span>
              <span className="text-lg font-black tracking-wider text-white">VERSE</span>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <motion.button
                key={link.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo(link.href, link.label)}
                className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeLink === link.label
                    ? 'text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {activeLink === link.label && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/40 to-indigo-600/40 border border-violet-500/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Right Icons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </motion.button>

            {/* Notifications */}
            <motion.div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-black" />
              </motion.button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-72 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-4 z-50"
                  >
                    <p className="text-white/40 text-xs font-semibold mb-3 uppercase tracking-wider">Notifications</p>
                    {[
                      { text: 'ShadowKnight invited you to Ludo', time: '2m ago', dot: 'bg-violet-500' },
                      { text: 'You ranked up to Level 12!', time: '1h ago', dot: 'bg-amber-500' },
                      { text: 'New tournament starting soon', time: '3h ago', dot: 'bg-blue-500' },
                    ].map((n, i) => (
                      <div key={i} className="flex gap-3 items-start py-2 border-b border-white/5 last:border-0">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.dot}`} />
                        <div>
                          <p className="text-white/80 text-sm">{n.text}</p>
                          <p className="text-white/30 text-xs mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Friends Online Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">4 Online</span>
            </div>

            {/* Virtual Chip Balance Pill */}
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs transition-all shadow-sm shadow-amber-500/10 group cursor-pointer"
              title="Virtual Chip Vault (Non-monetary)"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>{chipsBalance !== null ? chipsBalance.toLocaleString() : '100,000'}</span>
              <span className="hidden xl:inline text-[10px] text-amber-400/60 uppercase">Chips</span>
            </Link>

            {/* Auth Buttons or Profile Dropdown */}
            {user ? (
              <motion.div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                    {playerAvatar}
                  </div>
                  <span className="text-white/90 text-sm font-semibold max-w-[100px] truncate">{displayName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono font-bold">
                    Lv.{playerLevel}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-12 w-56 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-white font-bold text-sm truncate">{displayName}</p>
                        <p className="text-violet-400 text-xs font-mono">{profile?.player_id || 'GV-849201'}</p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
                      >
                        <LayoutDashboard className="w-4 h-4 text-violet-400" />
                        Command Center
                      </Link>

                      <Link
                        href="/wallet"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
                      >
                        <Wallet className="w-4 h-4 text-amber-400" />
                        Virtual Chip Wallet
                      </Link>

                      <Link
                        href="/wallet/request-chips"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
                      >
                        <Coins className="w-4 h-4 text-emerald-400" />
                        Request Free Chips
                      </Link>

                      <Link
                        href="/games/teen-patti"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
                      >
                        <Gamepad2 className="w-4 h-4 text-rose-400" />
                        Teen Patti Lounge
                      </Link>

                      {/* Admin Links if user is admin */}
                      {(profile?.role === 'admin' || profile?.username === 'admin' || user?.email?.includes('admin')) && (
                        <>
                          <div className="px-4 pt-2 pb-1 text-[10px] uppercase font-mono font-semibold tracking-wider text-amber-400/80 border-t border-white/5">
                            Admin Operations
                          </div>
                          <Link
                            href="/admin/chips"
                            onClick={() => setProfileOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            Admin Chip Management
                          </Link>
                          <Link
                            href="/admin/chip-requests"
                            onClick={() => setProfileOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
                          >
                            <Coins className="w-4 h-4 text-cyan-400" />
                            Review Chip Requests
                          </Link>
                        </>
                      )}

                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm border-t border-white/5"
                      >
                        <User className="w-4 h-4 text-cyan-400" />
                        Edit Profile
                      </Link>

                      <div className="border-t border-white/5">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 transition-all text-sm cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold border border-white/10 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all"
                >
                  Join
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-4 py-3 border-t border-white/5 space-y-1">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.label}
                      onClick={() => scrollTo(link.href, link.label)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        activeLink === link.label
                          ? 'bg-violet-600/30 text-white border border-violet-500/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </button>
                  );
                })}

                {/* Mobile Auth Links */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  {/* Mobile Chip Vault Display */}
                  <Link
                    href="/wallet"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      Virtual Chip Vault
                    </span>
                    <span className="font-mono font-bold">{chipsBalance !== null ? chipsBalance.toLocaleString() : '100,000'} Chips</span>
                  </Link>

                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-violet-600/20 text-white text-sm font-semibold border border-violet-500/30"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-violet-400" />
                          Command Center ({displayName})
                        </span>
                        <span className="text-xs font-mono text-violet-300">Lv.{playerLevel}</span>
                      </Link>

                      {(profile?.role === 'admin' || profile?.username === 'admin' || user?.email?.includes('admin')) && (
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href="/admin/chips"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Chip Admin
                          </Link>
                          <Link
                            href="/admin/chip-requests"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold"
                          >
                            <Coins className="w-3.5 h-3.5" /> Requests
                          </Link>
                        </div>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-rose-400 text-sm font-semibold hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button onClick={() => setSearchOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
                    <Search className="w-4 h-4" /> Search
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> 4 Online
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <Search className="w-5 h-5 text-violet-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games, players, tournaments..."
                  className="flex-1 bg-transparent text-white placeholder-white/30 text-base outline-none"
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X className="w-5 h-5 text-white/40 hover:text-white transition-colors" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">Quick Search</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Ludo', 'Snake & Ladder', 'Tic Tac Toe', 'Racing'].map((game) => (
                    <button key={game} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-all text-left">
                      🎮 {game}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for dropdowns */}
      {(profileOpen || notifOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setProfileOpen(false); setNotifOpen(false); }} />
      )}
    </>
  );
}
