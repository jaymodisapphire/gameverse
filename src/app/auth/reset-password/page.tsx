'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { validatePassword } from '@/lib/auth/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordAnalysis = useMemo(() => {
    return validatePassword(password);
  }, [password]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    if (!passwordAnalysis.isValid) {
      setErrorMessage(passwordAnalysis.errors[0] || 'Password does not meet security criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setErrorMessage(error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Password updated successfully! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1200);
    } catch {
      setErrorMessage('Failed to update password. Your recovery link may be expired or invalid.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
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
                Security Center
              </span>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-white mt-6 tracking-tight">
            UPDATE <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">PASSWORD</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Choose a strong, unique password for your GameVerse account.
          </p>
        </div>

        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,25,0.92), rgba(20,20,40,0.88))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 40px rgba(16,185,129,0.15)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 opacity-80" />

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                  New Password
                </label>
                {password && (
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: passwordAnalysis.color }}
                  >
                    {passwordAnalysis.label}
                  </span>
                )}
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
                  placeholder="Min 8 chars with mixed cases"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          passwordAnalysis.score >= level
                            ? passwordAnalysis.color
                            : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Confirm New Password
                </label>
                {confirmPassword && (
                  <span
                    className={`text-[11px] font-semibold ${
                      passwordsMatch ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {passwordsMatch ? 'Match' : 'Mismatch'}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-600/30 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>SAVE NEW PASSWORD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
