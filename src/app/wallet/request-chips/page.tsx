'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth/auth-context';
import { submitChipRequest } from '@/lib/wallet/wallet-service';

const CHIP_PRESETS = [10000, 25000, 50000, 100000, 250000];

export default function RequestChipsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [amount, setAmount] = useState<number>(50000);
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > 1000000) {
      setError('Amount must be between 1,000 and 1,000,000 virtual chips.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const userId = user?.id || 'demo-player';
    const username = profile?.username || 'Player';

    const res = await submitChipRequest(userId, username, amount, message);
    setIsSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/wallet/requests');
      }, 2000);
    } else {
      setError(res.error || 'Failed to submit request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      {/* Background Ambience */}
      <div className="absolute top-20 left-1/3 w-[600px] h-[350px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10">
        {/* Navigation Back */}
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chip Vault</span>
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Bonus Request</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            REQUEST VIRTUAL CHIPS
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Running low on chips? Submit a bonus request to the GAMEVERSE administrators.
          </p>
        </div>

        {/* Request Form Container */}
        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(20,18,34,0.95), rgba(28,24,48,0.9))',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)',
          }}
        >
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">REQUEST SUBMITTED!</h2>
              <p className="text-white/60 text-sm max-w-sm mx-auto mb-4">
                Your request for <strong>{amount.toLocaleString()} virtual chips</strong> is now in the admin review queue.
              </p>
              <p className="text-xs text-violet-400">Redirecting to your request status tracker...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Amount Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  Select Chip Amount
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CHIP_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(p)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        amount === p
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {p >= 1000 ? `${p / 1000}K` : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  Or Enter Custom Amount
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                  <input
                    type="number"
                    min={1000}
                    max={1000000}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400 text-white font-mono text-base outline-none transition-all"
                  />
                </div>
                <span className="text-[11px] text-white/40 mt-1 block">
                  Allowed range: 1,000 to 1,000,000 virtual chips
                </span>
              </div>

              {/* Message to Admin */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  Message to Admin (Optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Practicing high-roller Teen Patti tournament strategies!"
                  maxLength={300}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 text-white text-sm outline-none transition-all resize-none placeholder-white/30"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Send Chip Request'}</span>
              </button>

              <div className="text-center">
                <Link
                  href="/wallet/requests"
                  className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View your previous request history</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
