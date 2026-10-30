'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  ArrowLeft,
  Coins,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth/auth-context';
import { adminGetPendingRequests, adminReviewRequest } from '@/lib/wallet/wallet-service';
import { ChipRequest } from '@/lib/wallet/types';

export default function AdminChipRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ChipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');

  // Review Dialog State
  const [reviewModal, setReviewModal] = useState<{
    request: ChipRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRequests = async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    const list = await adminGetPendingRequests();
    setRequests(list);
    if (showSpinner) setIsLoading(false);
  };

  useEffect(() => {
    loadRequests(true);
    // Real-time auto-refresh polling every 3 seconds for live requests
    const interval = setInterval(() => loadRequests(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCommitReview = async () => {
    if (!reviewModal) return;
    setIsSubmitting(true);
    setFeedback(null);

    const adminId = user?.id || 'admin-root';
    const res = await adminReviewRequest(
      adminId,
      reviewModal.request.id,
      reviewModal.action,
      adminNote
    );
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Request successfully ${reviewModal.action === 'approve' ? 'approved and credited' : 'rejected'}.`,
      });
      setReviewModal(null);
      setAdminNote('');
      loadRequests();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to complete review.',
      });
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch =
      !search ||
      r.requesterUsername?.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10">
        <Link
          href="/admin/chips"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chip Management</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Approvals Queue</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              REVIEW CHIP REQUESTS
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Approve or reject submitted player requests with guaranteed atomic, exactly-once balance credits.
            </p>
          </div>

          <button
            onClick={loadRequests}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            {(['pending', 'all', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by player or ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Requests Queue */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-white/3 border border-white/8 p-8">
            <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Queue is Clear</h3>
            <p className="text-white/40 text-xs max-w-sm mx-auto">
              No chip requests found under current filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white/3 hover:bg-white/5 border border-white/8 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-black text-white text-base">
                      {r.requesterUsername || 'Unknown Player'}
                    </span>
                    <span className="font-mono text-base font-black text-amber-400">
                      +{r.requestedAmount.toLocaleString()} Chips
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        r.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : r.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p className="text-xs text-white/60 mb-2">
                    &ldquo;{r.requestMessage || 'No message'}&rdquo;
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-white/40 font-mono">
                    <span>Submitted: {new Date(r.createdAt).toLocaleString()}</span>
                    <span>ID: {r.id.substring(0, 14)}...</span>
                  </div>
                </div>

                {r.status === 'pending' ? (
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        setReviewModal({ request: r, action: 'approve' });
                        setAdminNote('Approved by administrator');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      Approve (+{r.requestedAmount >= 1000 ? `${r.requestedAmount / 1000}K` : r.requestedAmount})
                    </button>
                    <button
                      onClick={() => {
                        setReviewModal({ request: r, action: 'reject' });
                        setAdminNote('Request rejected based on policy');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs uppercase transition-all cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="text-right text-xs text-white/40 font-mono">
                    <span>Admin reviewed</span>
                    {r.adminResponse && (
                      <p className="text-[11px] text-violet-300/80 mt-1 max-w-xs truncate">
                        {r.adminResponse}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal: Review Action Dialog */}
        {reviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="max-w-md w-full rounded-3xl border border-white/10 p-6 sm:p-8 relative bg-[#0f0e1c] shadow-2xl">
              <button
                onClick={() => setReviewModal(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <span
                  className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    reviewModal.action === 'approve' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  Confirm {reviewModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </span>
                <h2 className="text-xl font-black text-white">
                  {reviewModal.action === 'approve' ? 'Approve & Credit' : 'Reject Request'}
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Player: <strong>{reviewModal.request.requesterUsername}</strong> • Amount:{' '}
                  <strong>{reviewModal.request.requestedAmount.toLocaleString()} Chips</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Admin Response / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g. Granted bonus for competitive activity"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-violet-500 placeholder-white/30"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setReviewModal(null)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommitReview}
                    disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase text-black cursor-pointer disabled:opacity-50 ${
                      reviewModal.action === 'approve'
                        ? 'bg-emerald-500 hover:bg-emerald-400'
                        : 'bg-rose-500 hover:bg-rose-400 text-white'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : reviewModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
