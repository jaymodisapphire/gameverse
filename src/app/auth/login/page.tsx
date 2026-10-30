'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Gamepad2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { validateEmail, sanitizeRedirectUrl } from '@/lib/auth/validation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = sanitizeRedirectUrl(searchParams.get('redirect'), '/dashboard');

  const { signInWithPassword, signInWithOAuth, isConfigured, demoMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    // Validate email
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.error || 'Please provide a valid email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signInWithPassword(email.trim(), password);

      if (error) {
        setErrorMessage(error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Login successful! Launching your GameVerse session...');
      setTimeout(() => {
        router.push(redirectTarget);
      }, 700);
    } catch {
      setErrorMessage('An unexpected network or service error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isOAuthSubmitting) return;
    setIsOAuthSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await signInWithOAuth('google');
      if (error) {
        if (error.includes('provider is not enabled') || error.includes('Unsupported provider')) {
          setErrorMessage('Google OAuth is not enabled in your Supabase project yet. Please enable Google in Supabase Dashboard > Authentication > Providers, or log in with Email & Password below.');
        } else {
          setErrorMessage(error);
        }
        setIsOAuthSubmitting(false);
      } else if (demoMode) {
        setSuccessMessage('Logged in with Google Demo Account!');
        setTimeout(() => {
          router.push(redirectTarget);
        }, 800);
      }
    } catch {
      setErrorMessage('Google Provider is not enabled in your database. Please use Email/Password sign in below.');
      setIsOAuthSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('player@gameverse.gg');
    setPassword('GameVerse@2026!');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card Header / Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-200">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center text-xl font-black tracking-wider">
                <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                  GAME
                </span>
                <span className="text-white">VERSE</span>
              </div>
              <span className="text-[11px] text-white/40 uppercase tracking-widest block font-medium">
                Gaming Command Center
              </span>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-white mt-6 tracking-tight">
            WELCOME BACK, <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">PLAYER</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Sign in to access your stats, games, and squad.
          </p>
        </div>

        {/* Demo Mode / Supabase Banner */}
        {!isConfigured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-5 p-3.5 rounded-xl bg-violet-950/40 border border-violet-500/30 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 text-violet-300">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span>Demo Mode Active (Ready for Supabase)</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-white font-semibold text-[11px] transition-colors"
            >
              Fill Demo
            </button>
          </motion.div>
        )}

        {/* Form Card */}
        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,25,0.92), rgba(20,20,40,0.88))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.15)',
          }}
        >
          {/* Top subtle glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 opacity-80" />

          {/* Feedback Alerts */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isOAuthSubmitting || isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group mb-5"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isOAuthSubmitting ? 'Connecting Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-semibold tracking-wider text-white/30 uppercase">
              Or email sign in
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Quick Fill Credentials */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-white/8 mb-4">
            <span className="text-[10px] text-white/40 uppercase font-mono">Quick Credentials:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@gameverse.com');
                  setPassword('Admin@Gameverse2026!');
                  setErrorMessage(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-all cursor-pointer"
              >
                👑 Fill Admin ID
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('player@gameverse.gg');
                  setPassword('GameVerse@2026!');
                  setErrorMessage(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-[11px] font-bold border border-violet-500/30 transition-all cursor-pointer"
              >
                🎮 Fill Player ID
              </button>
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@gameverse.gg"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-violet-600"
                />
                <span className="text-xs text-white/60">Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || isOAuthSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg shadow-violet-600/30 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch to Sign Up */}
          <div className="text-center mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-white/50">
              New to GameVerse?{' '}
              <Link
                href="/auth/signup"
                className="font-bold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Create Player Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/50 text-sm">Loading GameVerse Auth...</div>}>
      <LoginForm />
    </Suspense>
  );
}

