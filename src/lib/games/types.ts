export interface CatalogGame {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructions: string;
  category: 'arcade' | 'action' | 'racing' | 'classic';
  accentColor: string;
  supportedInputs: ('keyboard' | 'touch' | 'mouse')[];
  engine: 'html5-canvas' | 'three' | 'custom';
  isPublished: boolean;
  playsCount: number;
  rating: number;
  emoji: string;
  tags: string[];
}

export interface GameCategory {
  slug: string;
  name: string;
  icon: string;
  description: string;
}

export interface GameSession {
  id?: string;
  userId?: string;
  gameSlug: string;
  score: number;
  durationSeconds: number;
  status: 'active' | 'completed' | 'abandoned';
  createdAt?: string;
}

export interface PlayerScore {
  gameSlug: string;
  highScore: number;
  totalPlays: number;
  lastPlayedAt: string;
}

export interface GameEngineOptions {
  soundEnabled: boolean;
  onScoreUpdate: (score: number, multiplier?: number) => void;
  onGameOver: (finalScore: number, durationSeconds: number) => void;
  onStateChange?: (state: 'idle' | 'running' | 'paused' | 'gameover') => void;
}

export interface GameEngine {
  init: (canvas: HTMLCanvasElement, options: GameEngineOptions) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  destroy: () => void;
  handleInput: (action: string, active: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
}
