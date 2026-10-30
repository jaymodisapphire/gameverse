'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Coins,
  RefreshCw,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth/auth-context';
import { getPlayerChipRequests } from '@/lib/wallet/wallet-service';
import { ChipRequest } from '@/lib/wallet/types';

export default function MyChipRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ChipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.id || 'demo-player';

  const loadRequests = async () => {
    setIsLoading(true);
    const list = await getPlayerChipRequests(userId);
    setRequests(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [userId]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20 relative z-10">
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chip Vault</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              MY CHIP REQUESTS
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Track the status of your submitted bonus chip requests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRequests}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/wallet/request-chips"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Request</span>
            </Link>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-white/3 border border-white/8 p-8">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Requests Submitted Yet</h3>
            <p className="text-white/40 text-xs max-w-sm mx-auto mb-4">
              Need extra virtual chips? Submit a request and our admins will review it promptly.
            </p>
            <Link
              href="/wallet/request-chips"
              className="px-5 py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 text-xs font-bold inline-flex items-center gap-2"
            >
              <Coins className="w-4 h-4" />
              <span>Request 50,000 Chips</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const statusStyles = {
                pending: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
                cancelled: 'bg-white/5 text-white/40 border-white/10',
              }[r.status];

              const StatusIcon = {
                pending: Clock,
                approved: CheckCircle2,
                rejected: XCircle,
                cancelled: XCircle,
              }[r.status];

              return (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-white/3 hover:bg-white/5 border border-white/8 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="font-mono text-xl font-black text-white">
                        {r.requestedAmount.toLocaleString()} Chips
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyles}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{r.status}</span>
                      </span>
                    </div>

                    <p className="text-xs text-white/60">
                      Message: &ldquo;{r.requestMessage || 'No message provided'}&rdquo;
                    </p>

                    {r.adminResponse && (
                      <div className="mt-2 text-xs p-2.5 rounded-lg bg-black/40 border border-white/5 text-violet-300">
                        <strong>Admin Note: </strong> {r.adminResponse}
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right text-xs text-white/40 font-mono">
                    <div>Submitted: {new Date(r.createdAt).toLocaleDateString()}</div>
                    {r.reviewedAt && (
                      <div className="text-[11px] text-white/30">
                        Reviewed: {new Date(r.reviewedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
