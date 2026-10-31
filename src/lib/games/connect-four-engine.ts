/**
 * Cyber Connect Four Game Engine & AI
 * 7 Columns x 6 Rows vertical gravity grid
 */

export type C4Player = 'red' | 'cyan';
export type C4Cell = C4Player | null;

export const ROWS = 6;
export const COLS = 7;

export interface C4WinResult {
  winner: C4Player | 'Tie';
  winningCoords: [number, number][]; // [row, col][]
}

/**
 * Creates empty 6x7 grid (row 0 = top, row 5 = bottom)
 */
export function createEmptyGrid(): C4Cell[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

/**
 * Find the lowest available row in a column (gravity drop)
 */
export function getDropRow(grid: C4Cell[][], col: number): number | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r][col] === null) {
      return r;
    }
  }
  return null;
}

/**
 * Check if column is playable
 */
export function canDrop(grid: C4Cell[][], col: number): boolean {
  return grid[0][col] === null;
}

/**
 * Checks for 4-in-a-row across horizontal, vertical, and diagonals
 */
export function checkC4Winner(grid: C4Cell[][]): C4WinResult | null {
  // 1. Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cell = grid[r][c];
      if (
        cell &&
        cell === grid[r][c + 1] &&
        cell === grid[r][c + 2] &&
        cell === grid[r][c + 3]
      ) {
        return {
          winner: cell,
          winningCoords: [
            [r, c],
            [r, c + 1],
            [r, c + 2],
            [r, c + 3],
          ],
        };
      }
    }
  }

  // 2. Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (
        cell &&
        cell === grid[r + 1][c] &&
        cell === grid[r + 2][c] &&
        cell === grid[r + 3][c]
      ) {
        return {
          winner: cell,
          winningCoords: [
            [r, c],
            [r + 1, c],
            [r + 2, c],
            [r + 3, c],
          ],
        };
      }
    }
  }

  // 3. Diagonal (Down-Right)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cell = grid[r][c];
      if (
        cell &&
        cell === grid[r + 1][c + 1] &&
        cell === grid[r + 2][c + 2] &&
        cell === grid[r + 3][c + 3]
      ) {
        return {
          winner: cell,
          winningCoords: [
            [r, c],
            [r + 1, c + 1],
            [r + 2, c + 2],
            [r + 3, c + 3],
          ],
        };
      }
    }
  }

  // 4. Diagonal (Up-Right)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const cell = grid[r][c];
      if (
        cell &&
        cell === grid[r - 1][c + 1] &&
        cell === grid[r - 2][c + 2] &&
        cell === grid[r - 3][c + 3]
      ) {
        return {
          winner: cell,
          winningCoords: [
            [r, c],
            [r - 1, c + 1],
            [r - 2, c + 2],
            [r - 3, c + 3],
          ],
        };
      }
    }
  }

  // Check for Tie
  const isFull = grid[0].every((cell) => cell !== null);
  if (isFull) {
    return { winner: 'Tie', winningCoords: [] };
  }

  return null;
}

/**
 * Intelligent Bot AI for Connect Four
 * Returns the column index (0..6) to play.
 */
export function getC4AIMove(grid: C4Cell[][], difficulty: 'easy' | 'hard' = 'hard'): number {
  const validCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (canDrop(grid, c)) {
      validCols.push(c);
    }
  }

  if (validCols.length === 0) return 0;
  if (difficulty === 'easy') {
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // 1. Check if Bot ('cyan') can win in 1 move
  for (const c of validCols) {
    const r = getDropRow(grid, c);
    if (r !== null) {
      grid[r][c] = 'cyan';
      const win = checkC4Winner(grid);
      grid[r][c] = null;
      if (win?.winner === 'cyan') return c;
    }
  }

  // 2. Block opponent ('red') from winning in 1 move
  for (const c of validCols) {
    const r = getDropRow(grid, c);
    if (r !== null) {
      grid[r][c] = 'red';
      const win = checkC4Winner(grid);
      grid[r][c] = null;
      if (win?.winner === 'red') return c;
    }
  }

  // 3. Avoid dropping in a column that would give opponent a winning drop right above us!
  const safeCols = validCols.filter((c) => {
    const r = getDropRow(grid, c);
    if (r !== null && r > 0) {
      // simulate our move
      grid[r][c] = 'cyan';
      // simulate opponent move on top
      grid[r - 1][c] = 'red';
      const oppWins = checkC4Winner(grid)?.winner === 'red';
      grid[r - 1][c] = null;
      grid[r][c] = null;
      return !oppWins;
    }
    return true;
  });

  const candidates = safeCols.length > 0 ? safeCols : validCols;

  // 4. Prefer center columns: 3 (center) > 2, 4 > 1, 5 > 0, 6
  const colPreferences = [3, 2, 4, 1, 5, 0, 6];
  for (const preferred of colPreferences) {
    if (candidates.includes(preferred)) {
      return preferred;
    }
  }

  return candidates[0];
}
