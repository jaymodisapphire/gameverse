/**
 * Cyber Ludo Engine & AI Intelligence
 * Handles:
 *  - Board logic (52 track steps, 4 home paths, safe spots)
 *  - Bot AI (Capture priority, 6-deployment, home run, safety heuristics)
 *  - Turn progression & win detection
 */

export type LudoColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LudoPlayer {
  id: string;
  name: string;
  color: LudoColor;
  isBot: boolean;
  avatar?: string;
}

export interface LudoGameState {
  roomCode?: string;
  mode: 'bot' | 'local' | 'online';
  players: LudoPlayer[];
  turn: LudoColor;
  diceValue: number;
  hasRolled: boolean;
  isRolling: boolean;
  pawns: Record<LudoColor, number[]>; // -1 = base, 0..51 = track, 52..56 = home path, 57 = finished
  winner: LudoColor | null;
  gameLog: string[];
}

export const LUDO_COLORS: LudoColor[] = ['red', 'green', 'yellow', 'blue'];

export const LUDO_CONFIG: Record<LudoColor, {
  name: string;
  botName: string;
  bg: string;
  text: string;
  border: string;
  startTrackIndex: number;
}> = {
  red: { name: 'Cyber Red', botName: 'Nexus Red', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500', startTrackIndex: 0 },
  green: { name: 'Emerald Green', botName: 'Matrix Green', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', startTrackIndex: 13 },
  yellow: { name: 'Solar Yellow', botName: 'Helios Yellow', bg: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400', startTrackIndex: 26 },
  blue: { name: 'Neon Blue', botName: 'Quantum Blue', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', startTrackIndex: 39 },
};

// Safe spots where pawns cannot be captured
export const SAFE_TRACK_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Converts a player's relative step (0..51) to absolute board track index (0..51)
 */
export function getAbsoluteTrackIndex(color: LudoColor, relativeStep: number): number | null {
  if (relativeStep < 0 || relativeStep > 51) return null; // In base or home stretch
  const start = LUDO_CONFIG[color].startTrackIndex;
  return (start + relativeStep) % 52;
}

/**
 * Check if moving this pawn is legal
 */
export function isMoveLegal(currentStep: number, roll: number): boolean {
  if (currentStep === 57) return false;
  if (currentStep === -1) return roll === 6;
  return currentStep + roll <= 57;
}

/**
 * Intelligent Bot Decision Algorithm for Ludo
 * Returns the index of the best pawn to move (0..3), or null if no legal moves exist.
 */
export function chooseBestLudoMove(
  color: LudoColor,
  pawns: Record<LudoColor, number[]>,
  roll: number
): number | null {
  const myPawns = pawns[color];
  const legalMoves: number[] = [];

  for (let i = 0; i < myPawns.length; i++) {
    if (isMoveLegal(myPawns[i], roll)) {
      legalMoves.push(i);
    }
  }

  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  // Heuristic evaluation for each legal move
  let bestScore = -Infinity;
  let bestPawnIndex = legalMoves[0];

  for (const pawnIdx of legalMoves) {
    const currentStep = myPawns[pawnIdx];
    let score = 0;

    // 1. Can deploy from base with 6
    if (currentStep === -1 && roll === 6) {
      score += 60; // Strong incentive to deploy new pawns
      // Extra incentive if no pawns are currently on the track
      const activePawns = myPawns.filter((s) => s >= 0 && s < 57).length;
      if (activePawns === 0) score += 100;
    } else {
      const targetStep = currentStep + roll;

      // 2. Can reach home (57)? Highest priority!
      if (targetStep === 57) {
        score += 200;
      }
      // 3. Reaching safe home stretch (52..56)? Very safe!
      else if (targetStep >= 52) {
        score += 80;
      } else {
        // 4. Can capture an opponent pawn? High priority!
        const targetAbs = getAbsoluteTrackIndex(color, targetStep);
        if (targetAbs !== null && !SAFE_TRACK_POSITIONS.includes(targetAbs)) {
          let canCapture = false;
          for (const otherColor of LUDO_COLORS) {
            if (otherColor === color) continue;
            for (const oppStep of pawns[otherColor]) {
              const oppAbs = getAbsoluteTrackIndex(otherColor, oppStep);
              if (oppAbs === targetAbs) {
                canCapture = true;
                break;
              }
            }
            if (canCapture) break;
          }
          if (canCapture) score += 150;
        }

        // 5. Moving onto a safe spot?
        if (targetAbs !== null && SAFE_TRACK_POSITIONS.includes(targetAbs)) {
          score += 40;
        }

        // 6. Prefer moving pawns further along the track
        score += currentStep * 1.5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestPawnIndex = pawnIdx;
    }
  }

  return bestPawnIndex;
}

/**
 * Creates an initial clean Ludo game state
 */
export function createInitialLudoState(
  mode: 'bot' | 'local' | 'online' = 'bot',
  userPlayerName: string = 'Commander',
  roomCode?: string
): LudoGameState {
  const players: LudoPlayer[] = [
    { id: 'p-red', name: userPlayerName, color: 'red', isBot: false },
    { id: 'p-green', name: mode === 'local' ? 'Player 2' : LUDO_CONFIG.green.botName, color: 'green', isBot: mode === 'bot' },
    { id: 'p-yellow', name: mode === 'local' ? 'Player 3' : LUDO_CONFIG.yellow.botName, color: 'yellow', isBot: mode === 'bot' },
    { id: 'p-blue', name: mode === 'local' ? 'Player 4' : LUDO_CONFIG.blue.botName, color: 'blue', isBot: mode === 'bot' },
  ];

  return {
    roomCode,
    mode,
    players,
    turn: 'red',
    diceValue: 6,
    hasRolled: false,
    isRolling: false,
    pawns: {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
    },
    winner: null,
    gameLog: ['Welcome to Cyber Ludo Arena! Roll dice to begin the match.'],
  };
}
