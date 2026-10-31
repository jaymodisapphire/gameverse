import { CatalogGame, GameCategory, GameEngine } from './types';
import { NeonSnakeEngine } from './neon-snake';
import { SpaceDefenderEngine } from './space-defender';
import { NeonRacerEngine } from './neon-racer';

export const GAME_CATEGORIES: GameCategory[] = [
  { slug: 'all', name: 'All Games', icon: '🌌', description: 'Browse all playable in-browser web games' },
  { slug: 'arcade', name: 'Arcade', icon: '🕹️', description: 'Fast-paced classic reflex and retro-style games' },
  { slug: 'action', name: 'Action & Shooter', icon: '🚀', description: 'High-intensity survival and shooter games' },
  { slug: 'racing', name: 'Racing & Speed', icon: '🏎️', description: 'High-speed cyber vehicles and obstacle dodging' },
  { slug: 'classic', name: 'Board & Classic', icon: '🎲', description: 'Strategic board, cards, and puzzle challenges' },
];

export const CATALOG_GAMES: CatalogGame[] = [
  {
    id: 'g-neon-snake',
    slug: 'neon-snake',
    title: 'Neon Snake',
    description: 'Futuristic cyber-grid snake. Devour glowing quantum pellets, dodge laser borders, and build the ultimate high score chain.',
    instructions: 'Use Arrow Keys or WASD to navigate. On mobile, use the on-screen D-Pad. Collect quantum fruit to grow and increase your score.',
    category: 'arcade',
    accentColor: '#10b981',
    supportedInputs: ['keyboard', 'touch'],
    engine: 'html5-canvas',
    isPublished: true,
    playsCount: 14820,
    rating: 4.92,
    emoji: '🐍',
    tags: ['Retro', 'Arcade', 'Reflex', 'Cyberpunk'],
  },
  {
    id: 'g-space-defender',
    slug: 'space-defender',
    title: 'Space Defender',
    description: '2D arcade space shooter. Pilot your starfighter against advancing waves of alien drones, plasma cruisers, and asteroid clusters.',
    instructions: 'Use Arrow Keys or WASD to steer. Auto-fires plasma lasers. Press Space to manually fire. Destroy enemies and evade incoming collisions.',
    category: 'action',
    accentColor: '#8b5cf6',
    supportedInputs: ['keyboard', 'touch'],
    engine: 'html5-canvas',
    isPublished: true,
    playsCount: 21940,
    rating: 4.95,
    emoji: '🚀',
    tags: ['Shooter', 'Sci-Fi', 'Space', 'Survival'],
  },
  {
    id: 'g-neon-racer',
    slug: 'neon-racer',
    title: 'Neon Racer',
    description: 'High-octane arcade cyber-highway racer. Weave through traffic, grab speed-boost batteries, and push your reaction speed to the limit.',
    instructions: 'Use Left / Right Arrows or A / D to switch lanes. Use Up / W to trigger nitro boost. Avoid crashes and collect blue energy cells.',
    category: 'racing',
    accentColor: '#06b6d4',
    supportedInputs: ['keyboard', 'touch'],
    engine: 'html5-canvas',
    isPublished: true,
    playsCount: 18320,
    rating: 4.88,
    emoji: '🏎️',
    tags: ['Racing', 'Speed', 'Cyberpunk', 'Endless'],
  },
  {
    id: 'g-ludo',
    slug: 'ludo',
    title: 'Ludo Cyber Champion',
    description: 'Classic board strategy game. Race your tokens home against friends or AI in this multiplayer arena.',
    instructions: 'Roll the dice and race your 4 pawns home around the board while knocking opponents back.',
    category: 'classic',
    accentColor: '#8b5cf6',
    supportedInputs: ['mouse', 'touch'],
    engine: 'html5-canvas',
    isPublished: true,
    playsCount: 9420,
    rating: 4.75,
    emoji: '🎲',
    tags: ['Multiplayer', 'Strategy', 'Board'],
  },
  {
    id: 'g-tic-tac-toe',
    slug: 'tic-tac-toe',
    title: 'Neon Tic Tac Toe',
    description: 'The ultimate battle of neon X vs O. Challenge intelligent AI or play with a friend.',
    instructions: 'Place your mark on the 3x3 cyber grid to form a line of 3 horizontally, vertically, or diagonally.',
    category: 'classic',
    accentColor: '#f43f5e',
    supportedInputs: ['mouse', 'touch'],
    engine: 'html5-canvas',
    isPublished: true,
    playsCount: 8120,
    rating: 4.65,
    emoji: '❌',
    tags: ['Puzzle', 'AI', 'Strategy'],
  },
  {
    id: 'g-teen-patti',
    slug: 'teen-patti',
    title: 'Teen Patti Royale',
    description: 'Authentic 3-card Indian Poker. Play with 2-6 players, hosted by AI Dealer Aria, with free virtual chips, real-time chaal, and showdowns.',
    instructions: 'Join a table or create a private room. Play blind or seen (chaal), raise the stakes, fold (pack), and show down when 2 players remain.',
    category: 'classic',
    accentColor: '#f59e0b',
    supportedInputs: ['mouse', 'touch'],
    engine: 'html5-canvas',
    isPublished: true,
    playsCount: 34100,
    rating: 4.98,
    emoji: '🃏',
    tags: ['Card', 'Multiplayer', 'Casino', 'Live Dealer'],
  },
  {
    id: 'g-connect-four',
    slug: 'connect-four',
    title: 'Cyber Connect Four',
    description: 'Vertical tactical duel. Drop quantum discs into 7 columns to align 4 in a row. Play online custom rooms or vs AI Sentinel.',
    instructions: 'Select any of the 7 columns to drop your quantum disc. First player to connect 4 discs horizontally, vertically, or diagonally wins.',
    category: 'classic',
    accentColor: '#06b6d4',
    supportedInputs: ['mouse', 'touch'],
    engine: 'html5-canvas',
    isPublished: true,
    playsCount: 11200,
    rating: 4.89,
    emoji: '🔴',
    tags: ['Strategy', 'Multiplayer', 'AI', 'Custom Rooms'],
  },
];

export function getGameBySlug(slug: string): CatalogGame | undefined {
  return CATALOG_GAMES.find((g) => g.slug === slug);
}

export function getGamesByCategory(category: string): CatalogGame[] {
  if (category === 'all') return CATALOG_GAMES;
  return CATALOG_GAMES.filter((g) => g.category === category);
}

export function searchGames(query: string, category: string = 'all'): CatalogGame[] {
  const q = query.toLowerCase().trim();
  let list = getGamesByCategory(category);
  if (!q) return list;

  return list.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.tags.some((t) => t.toLowerCase().includes(q))
  );
}

/**
 * Trusted Factory pattern: instantiates trusted game engines safely.
 */
export function createGameEngine(slug: string): GameEngine | null {
  switch (slug) {
    case 'neon-snake':
      return new NeonSnakeEngine();
    case 'space-defender':
      return new SpaceDefenderEngine();
    case 'neon-racer':
      return new NeonRacerEngine();
    default:
      return null;
  }
}
