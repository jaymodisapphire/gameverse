'use client';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';

export interface LocalScoreRecord {
  gameSlug: string;
  highScore: number;
  totalPlays: number;
  lastPlayedAt: string;
}

export interface LocalSessionRecord {
  gameSlug: string;
  score: number;
  durationSeconds: number;
  completedAt: string;
}

/**
 * Validates whether a score is physically possible based on game constraints (Anti-cheat check)
 */
export function validateScoreIntegrity(slug: string, score: number, durationSeconds: number): { valid: boolean; reason?: string } {
  if (score < 0 || durationSeconds < 0) {
    return { valid: false, reason: 'Negative score or duration' };
  }

  const duration = Math.max(1, durationSeconds);
  let maxRatePerSecond = 100;

  if (slug === 'neon-snake') {
    maxRatePerSecond = 50; // max ~50 pts/sec in snake
  } else if (slug === 'space-defender') {
    maxRatePerSecond = 120; // max ~120 pts/sec
  } else if (slug === 'neon-racer') {
    maxRatePerSecond = 80; // max ~80 pts/sec
  }

  const maxPossible = Math.max(100, duration * maxRatePerSecond);
  if (score > maxPossible) {
    return {
      valid: false,
      reason: `Score ${score} exceeds maximum calculated physics limit (${maxPossible}) for ${duration}s`,
    };
  }

  return { valid: true };
}

/**
 * Saves a completed game session and updates high scores.
 * Syncs to Supabase when authenticated, otherwise persists in localStorage.
 */
export async function recordGameSession(
  gameSlug: string,
  score: number,
  durationSeconds: number,
  userId?: string
): Promise<{ isNewHighScore: boolean; currentHighScore: number }> {
  // Validate Anti-Cheat
  const validation = validateScoreIntegrity(gameSlug, score, durationSeconds);
  if (!validation.valid) {
    console.warn('Game session rejected by anti-cheat:', validation.reason);
    return { isNewHighScore: false, currentHighScore: 0 };
  }

  // 1. Always update Local Storage (works for guests & offline)
  let isNewHighScore = false;
  let currentHighScore = 0;

  try {
    const highScoresKey = 'gameverse_high_scores';
    const existingScores: Record<string, LocalScoreRecord> = JSON.parse(
      localStorage.getItem(highScoresKey) || '{}'
    );

    const prev = existingScores[gameSlug];
    if (!prev) {
      existingScores[gameSlug] = {
        gameSlug,
        highScore: score,
        totalPlays: 1,
        lastPlayedAt: new Date().toISOString(),
      };
      isNewHighScore = score > 0;
      currentHighScore = score;
    } else {
      currentHighScore = prev.highScore;
      if (score > prev.highScore) {
        existingScores[gameSlug].highScore = score;
        isNewHighScore = true;
        currentHighScore = score;
      }
      existingScores[gameSlug].totalPlays += 1;
      existingScores[gameSlug].lastPlayedAt = new Date().toISOString();
    }
    localStorage.setItem(highScoresKey, JSON.stringify(existingScores));

    // Update Recently Played history
    const recentKey = 'gameverse_recent_sessions';
    const recentList: LocalSessionRecord[] = JSON.parse(
      localStorage.getItem(recentKey) || '[]'
    );
    recentList.unshift({
      gameSlug,
      score,
      durationSeconds,
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem(recentKey, JSON.stringify(recentList.slice(0, 20)));
  } catch (err) {
    console.error('Failed to update local game history:', err);
  }

  // 2. If authenticated & Supabase configured, call server submission endpoint
  if (userId && isSupabaseConfigured()) {
    try {
      const response = await fetch('/api/games/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug,
          score,
          durationSeconds,
        }),
      });
      const data = await response.json();
      if (data.new_high !== undefined) {
        isNewHighScore = data.new_high;
      }
    } catch (err) {
      console.error('Failed to sync score to server:', err);
    }
  }

  return { isNewHighScore, currentHighScore };
}

/**
 * Retrieves the player's high score for a specific game.
 */
export function getLocalHighScore(gameSlug: string): number {
  try {
    const highScoresKey = 'gameverse_high_scores';
    const existingScores: Record<string, LocalScoreRecord> = JSON.parse(
      localStorage.getItem(highScoresKey) || '{}'
    );
    return existingScores[gameSlug]?.highScore || 0;
  } catch {
    return 0;
  }
}

/**
 * Retrieves player favorites.
 */
export function getFavoriteGames(): string[] {
  try {
    return JSON.parse(localStorage.getItem('gameverse_favorites') || '[]');
  } catch {
    return [];
  }
}

/**
 * Toggles a game as favorite.
 */
export function toggleFavoriteGame(gameSlug: string): boolean {
  try {
    const list = getFavoriteGames();
    const index = list.indexOf(gameSlug);
    let isFav = false;
    if (index >= 0) {
      list.splice(index, 1);
      isFav = false;
    } else {
      list.push(gameSlug);
      isFav = true;
    }
    localStorage.setItem('gameverse_favorites', JSON.stringify(list));
    return isFav;
  } catch {
    return false;
  }
}

/**
 * Retrieves player's recently played sessions.
 */
export function getRecentSessions(): LocalSessionRecord[] {
  try {
    return JSON.parse(localStorage.getItem('gameverse_recent_sessions') || '[]');
  } catch {
    return [];
  }
}
