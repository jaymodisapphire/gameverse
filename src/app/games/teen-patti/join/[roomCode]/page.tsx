'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { getOrCreateTable } from '@/lib/teen-patti/table-manager';

function JoinRoomContent() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params?.roomCode as string;

  const [status, setStatus] = useState('Locating table...');

  useEffect(() => {
    if (!roomCode) return;

    setStatus(`Connecting to room ${roomCode}...`);
    const timer = setTimeout(() => {
      const table = getOrCreateTable(roomCode);
      router.replace(`/games/teen-patti/table/${table.id}`);
    }, 700);

    return () => clearTimeout(timer);
  }, [roomCode, router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 rounded-3xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mb-4 text-violet-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <h1 className="text-xl font-black text-white mb-1">JOINING TEEN PATTI ROOM</h1>
      <p className="text-sm text-amber-400 font-mono mb-4">{roomCode}</p>
      <p className="text-xs text-white/40">{status}</p>

      <Link
        href="/games/teen-patti/lobby"
        className="mt-8 inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Public Lobby</span>
      </Link>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JoinRoomContent />
    </Suspense>
  );
}
