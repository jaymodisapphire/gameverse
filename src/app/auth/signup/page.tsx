'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { validateEmail, validateUsername, validatePassword } from '@/lib/auth/validation';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithOAuth, isConfigured, demoMode } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live password strength calculations
  const passwordAnalysis = useMemo(() => {
    return validatePassword(password);
  }, [password]);

  // Live username validation
  const usernameAnalysis = useMemo(() => {
    if (!username) return { isValid: false, error: null };
    return validateUsername(username);
  }, [username]);

  // Live email validation
  const emailAnalysis = useMemo(() => {
    if (!email) return { isValid: false, error: null };
    return validateEmail(email);
  }, [email]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    // Validate username
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.isValid) {
      setErrorMessage(usernameCheck.error || 'Invalid username.');
      return;
    }

    // Validate email
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.error || 'Invalid email address.');
      return;
    }

    // Validate password
    if (!passwordAnalysis.isValid) {
      setErrorMessage(passwordAnalysis.errors[0] || 'Please create a stronger password.');
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Check terms
    if (!agreeTerms) {
      setErrorMessage('Please accept the GameVerse Terms of Service to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(email.trim(), password, username.trim());

      if (error) {
        setErrorMessage(error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Player account created! Generating your Player ID and entering the GameVerse...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 900);
    } catch {
      setErrorMessage('An unexpected error occurred during account registration.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (isOAuthSubmitting) return;
    setIsOAuthSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await signInWithOAuth('google');
      if (error) {
        if (error.includes('provider is not enabled') || error.includes('Unsupported provider')) {
          setErrorMessage('Google OAuth is not enabled in your Supabase project yet. Please enable Google in Supabase Dashboard > Authentication > Providers, or register with Email & Password below.');
        } else {
          setErrorMessage(error);
        }
        setIsOAuthSubmitting(false);
      } else if (demoMode) {
        setSuccessMessage('Registered with Google Account!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    } catch {
      setErrorMessage('Failed to connect to Google account service.');
      setIsOAuthSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-black py-12">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header / Logo */}
        <div className="text-center mb-6">
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
                Player Registration
              </span>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-white mt-5 tracking-tight">
            CLAIM YOUR <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">LEGEND</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Create your player profile, get your unique Player ID, and join the universe.
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,25,0.92), rgba(20,20,40,0.88))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 40px rgba(6,182,212,0.15)',
          }}
        >
          {/* Top subtle glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 opacity-80" />

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

          {/* Google Signup Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
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
            <span>{isOAuthSubmitting ? 'Connecting...' : 'Sign Up with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-semibold tracking-wider text-white/30 uppercase">
              Or register with email
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Player Username
                </label>
                {username && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      usernameAnalysis.isValid ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {usernameAnalysis.isValid ? (
                      <>
                        <Check className="w-3 h-3" /> Available
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" /> {usernameAnalysis.error}
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="CyberKnight_99"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Email Address
                </label>
                {email && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      emailAnalysis.isValid ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {emailAnalysis.isValid ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      'Invalid email format'
                    )}
                  </span>
                )}
              </div>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Password
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
                  placeholder="Min. 8 chars with mixed cases & symbols"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter Bars */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="grid grid-cols-4 gap-1.5">
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

                  {/* Requirements pills */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] text-white/50">
                    <span className={password.length >= 8 ? 'text-emerald-400' : ''}>
                      • 8+ chars
                    </span>
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-400' : ''}>
                      • Uppercase
                    </span>
                    <span className={/[0-9]/.test(password) ? 'text-emerald-400' : ''}>
                      • Number
                    </span>
                    <span
                      className={
                        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
                          ? 'text-emerald-400'
                          : ''
                      }
                    >
                      • Symbol
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Confirm Password
                </label>
                {confirmPassword && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      passwordsMatch ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
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
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/70 focus:bg-white/10 text-white placeholder-white/25 text-sm outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-500"
                />
                <span className="text-xs text-white/60 leading-relaxed">
                  I agree to the{' '}
                  <span className="text-cyan-400 hover:underline">Terms of Service</span> and{' '}
                  <span className="text-cyan-400 hover:underline">Fair Play Gaming Guidelines</span>.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || isOAuthSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-lg shadow-cyan-600/30 bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Player Profile...</span>
                </>
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch to Login */}
          <div className="text-center mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-white/50">
              Already have a player account?{' '}
              <Link
                href="/auth/login"
                className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
