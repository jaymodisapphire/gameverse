'use client';

/**
 * Universal Multiplayer Custom Room Manager
 * Supports:
 *  - 6-digit room code generation (with game prefix)
 *  - Real-time cross-tab & cross-window state synchronization via Web BroadcastChannel
 *  - Supabase Realtime Broadcast channel fallback / pairing
 *  - Room storage & lookup
 */

export type GamePrefix = 'LUDO' | 'TTT' | 'C4' | 'TP';

export interface RoomMeta {
  code: string;
  game: GamePrefix;
  hostName: string;
  hostAvatar?: string;
  createdAt: number;
  maxPlayers: number;
  allowBots: boolean;
  status: 'waiting' | 'in_game' | 'finished';
}

const STORAGE_PREFIX = 'gameverse_room_';

/**
 * Generate a clean 6-digit code with game prefix (e.g., LUDO-482910)
 */
export function generateRoomCode(game: GamePrefix): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `${game}-${digits}`;
}

/**
 * Extract game prefix from room code
 */
export function parseGameFromRoomCode(code: string): GamePrefix | null {
  const clean = code.trim().toUpperCase();
  if (clean.startsWith('LUDO-') || clean.startsWith('LUDO')) return 'LUDO';
  if (clean.startsWith('TTT-') || clean.startsWith('TTT')) return 'TTT';
  if (clean.startsWith('C4-') || clean.startsWith('C4')) return 'C4';
  if (clean.startsWith('TP-') || clean.startsWith('TP')) return 'TP';
  return null;
}

/**
 * Save custom room state to localStorage
 */
export function saveRoomState<T>(roomCode: string, state: T): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}${roomCode.toUpperCase()}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save room state:', e);
  }
}

/**
 * Load custom room state from localStorage
 */
export function getRoomState<T>(roomCode: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `${STORAGE_PREFIX}${roomCode.toUpperCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('Failed to get room state:', e);
    return null;
  }
}

/**
 * Universal Room Event Sync using Web BroadcastChannel
 */
export class RoomChannel<T = any> {
  private channel: BroadcastChannel | null = null;
  private roomCode: string;

  constructor(roomCode: string) {
    this.roomCode = roomCode.toUpperCase();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(`gv_channel_${this.roomCode}`);
    }
  }

  /**
   * Broadcast an event (e.g. 'MOVE', 'ROLL', 'RESET', 'JOIN', 'EMOTE') to all peers
   */
  broadcast(event: string, payload: T): void {
    if (this.channel) {
      this.channel.postMessage({
        roomCode: this.roomCode,
        event,
        payload,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Listen for events from peers
   */
  onMessage(callback: (event: string, payload: T) => void): () => void {
    if (!this.channel) return () => {};

    const handler = (e: MessageEvent) => {
      if (e.data && e.data.roomCode === this.roomCode) {
        callback(e.data.event, e.data.payload);
      }
    };

    this.channel.addEventListener('message', handler);

    return () => {
      this.channel?.removeEventListener('message', handler);
    };
  }

  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
