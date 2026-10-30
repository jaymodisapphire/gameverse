'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Gamepad2,
  Mail,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const { resendVerificationEmail } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    if (!email) {
      setErrorStatus('Please provide your registered email address.');
      return;
    }

    setIsResending(true);
    setErrorStatus(null);
    setResendStatus(null);

    try {
      const { error } = await resendVerificationEmail(email.trim());
      if (error) {
        setErrorStatus(error);
      } else {
        setResendStatus('Verification email re-sent! Please inspect your inbox.');
        setCooldown(60);
      }
    } catch {
      setErrorStatus('Failed to send verification email. Try again shortly.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-black">
      <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-8">
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
              Email Verification
            </span>
          </div>
        </Link>

        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-left"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,25,0.92), rgba(20,20,40,0.88))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.15)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500 opacity-80" />

          <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto mb-5 text-violet-400">
            <Mail className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-white text-center mb-2">
            CHECK YOUR INBOX
          </h1>
          <p className="text-white/60 text-xs sm:text-sm text-center leading-relaxed mb-6">
            We sent a verification link to{' '}
            <span className="text-white font-semibold">{email || 'your email address'}</span>. Click the link to activate your player account.
          </p>

          {resendStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{resendStatus}</span>
            </motion.div>
          )}

          {errorStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorStatus}</span>
            </motion.div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : isResending
                  ? 'Resending...'
                  : 'Resend Verification Email'}
              </span>
            </button>

            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/50 text-sm">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

