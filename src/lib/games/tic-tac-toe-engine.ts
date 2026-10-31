/**
 * Neon Tic Tac Toe Game Engine & Minimax Bot
 */

export type TTTMark = 'X' | 'O';
export type TTTSquare = TTTMark | null;

export interface TTTWinResult {
  winner: TTTMark | 'Tie';
  line: number[] | null;
}

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6],             // Diagonals
];

export function checkTTTWinner(board: TTTSquare[]): TTTWinResult | null {
  for (let i = 0; i < WINNING_LINES.length; i++) {
    const [a, b, c] = WINNING_LINES[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: WINNING_LINES[i] };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: 'Tie', line: null };
  }

  return null;
}

/**
 * Minimax recursive decision-maker for impossible AI
 */
function minimax(
  board: TTTSquare[],
  depth: number,
  isMaximizing: boolean
): { score: number; index?: number } {
  const result = checkTTTWinner(board);
  if (result) {
    if (result.winner === 'O') return { score: 10 - depth };
    if (result.winner === 'X') return { score: depth - 10 };
    if (result.winner === 'Tie') return { score: 0 };
  }

  const emptyIndices = board
    .map((v, i) => (v === null ? i : null))
    .filter((v): v is number => v !== null);

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestIndex = emptyIndices[0];

    for (const idx of emptyIndices) {
      board[idx] = 'O';
      const score = minimax(board, depth + 1, false).score;
      board[idx] = null;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    }

    return { score: bestScore, index: bestIndex };
  } else {
    let bestScore = Infinity;
    let bestIndex = emptyIndices[0];

    for (const idx of emptyIndices) {
      board[idx] = 'X';
      const score = minimax(board, depth + 1, true).score;
      board[idx] = null;

      if (score < bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    }

    return { score: bestScore, index: bestIndex };
  }
}

/**
 * Choose AI Move based on selected difficulty
 */
export function getTTTAIMove(
  board: TTTSquare[],
  difficulty: 'easy' | 'medium' | 'hard'
): number {
  const openIndices = board
    .map((v, i) => (v === null ? i : null))
    .filter((v): v is number => v !== null);

  if (openIndices.length === 0) return -1;

  if (difficulty === 'easy') {
    return openIndices[Math.floor(Math.random() * openIndices.length)];
  }

  if (difficulty === 'medium') {
    // 50% minimax, 50% random
    if (Math.random() > 0.5) {
      return openIndices[Math.floor(Math.random() * openIndices.length)];
    }
  }

  // Hard: Unbeatable Minimax
  const { index } = minimax([...board], 0, true);
  return index !== undefined ? index : openIndices[0];
}
