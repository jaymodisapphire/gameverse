'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Gamepad2,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { validateEmail } from '@/lib/auth/validation';

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.error || 'Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await resetPasswordForEmail(email.trim());

      if (error) {
        setErrorMessage(error);
        setIsSubmitting(false);
        return;
      }

      // Security measure: Do not disclose whether email exists in the database
      setIsSent(true);
      setIsSubmitting(false);
    } catch {
      setErrorMessage('Failed to send reset instructions. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-amber-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Header */}
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
                Account Recovery
              </span>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-white mt-6 tracking-tight">
            RESET <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">PASSWORD</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Enter your player email to receive recovery instructions.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,25,0.92), rgba(20,20,40,0.88))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 40px rgba(245,158,11,0.15)',
          }}
        >
          {/* Top subtle glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-violet-500 opacity-80" />

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

          {isSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-white">Reset Link Dispatched</h2>
              <p className="text-white/60 text-xs leading-relaxed max-w-sm mx-auto">
                If an account matches <span className="text-white font-semibold">{email}</span>, you will receive password reset instructions shortly.
              </p>
              <p className="text-white/40 text-[11px]">
                Please check your inbox and spam folders.
              </p>

              <div className="pt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsSent(false)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all"
                >
                  Send another request
                </button>
                <Link
                  href="/auth/login"
                  className="w-full py-3 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Sign In
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                  Player Email Address
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg shadow-amber-600/30 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Recovery Link...</span>
                  </>
                ) : (
                  <>
                    <span>SEND RESET LINK</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <div className="text-center pt-4 border-t border-white/10">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
