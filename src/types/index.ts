export interface Game {
  id: string;
  title: string;
  description: string;
  maxPlayers: number;
  category: string;
  hasAI: boolean;
  hasMultiplayer: boolean;
  gradient: string;
  accentColor: string;
  emoji: string;
  route: string;
  lastPlayed?: string;
}

export interface Friend {
  id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  currentGame?: string;
  level: number;
}

export interface LeaderboardPlayer {
  rank: number;
  username: string;
  avatar: string;
  wins: number;
  winRate: number;
  level: number;
  totalGames: number;
}

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: string;
}

// ==========================================
// Auth & User Profile Interfaces (Step 2)
// ==========================================

export interface UserProfile {
  id: string;
  username: string;
  player_id: string;
  avatar_url?: string;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  total_games: number;
  is_online?: boolean;
  is_admin?: boolean;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  label: 'Too Weak' | 'Weak' | 'Fair' | 'Strong' | 'Legendary';
  color: string;
  errors: string[];
}

export interface AuthErrorResponse {
  message: string;
  code?: string;
  status?: number;
}
