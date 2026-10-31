import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  chooseBestLudoMove,
  createInitialLudoState,
  getAbsoluteTrackIndex,
  isMoveLegal,
} from '../../src/lib/games/ludo-engine';
import {
  checkTTTWinner,
  getTTTAIMove,
  TTTSquare,
} from '../../src/lib/games/tic-tac-toe-engine';
import {
  createEmptyGrid,
  getDropRow,
  canDrop,
  checkC4Winner,
  getC4AIMove,
  C4Cell,
} from '../../src/lib/games/connect-four-engine';
import {
  generateRoomCode,
  parseGameFromRoomCode,
} from '../../src/lib/multiplayer/room-manager';

describe('--- Multiplayer Custom Rooms & Game Engines Suite ---', () => {
  // ==========================================
  // Section 1: Universal Room Manager
  // ==========================================
  describe('1. Universal Room Manager', () => {
    test('generateRoomCode() generates valid 6-digit prefixed code', () => {
      const ludoCode = generateRoomCode('LUDO');
      const tttCode = generateRoomCode('TTT');
      const c4Code = generateRoomCode('C4');
      const tpCode = generateRoomCode('TP');

      assert.match(ludoCode, /^LUDO-\d{6}$/);
      assert.match(tttCode, /^TTT-\d{6}$/);
      assert.match(c4Code, /^C4-\d{6}$/);
      assert.match(tpCode, /^TP-\d{6}$/);
    });

    test('parseGameFromRoomCode() identifies all supported game prefixes', () => {
      assert.strictEqual(parseGameFromRoomCode('LUDO-482910'), 'LUDO');
      assert.strictEqual(parseGameFromRoomCode('TTT-918231'), 'TTT');
      assert.strictEqual(parseGameFromRoomCode('C4-129481'), 'C4');
      assert.strictEqual(parseGameFromRoomCode('TP-1001'), 'TP');
      assert.strictEqual(parseGameFromRoomCode('INVALID-123'), null);
    });
  });

  // ==========================================
  // Section 2: Cyber Ludo Engine & AI
  // ==========================================
  describe('2. Cyber Ludo Engine & AI', () => {
    test('isMoveLegal() rejects pawn in base unless roll is 6', () => {
      assert.strictEqual(isMoveLegal(-1, 5), false);
      assert.strictEqual(isMoveLegal(-1, 6), true);
      assert.strictEqual(isMoveLegal(55, 3), false); // Over 57
      assert.strictEqual(isMoveLegal(55, 2), true);  // Exactly 57
    });

    test('chooseBestLudoMove() deploys from base when rolling 6 with all pawns in base', () => {
      const state = createInitialLudoState('bot');
      const bestMove = chooseBestLudoMove('red', state.pawns, 6);
      assert.ok(bestMove !== null && bestMove >= 0 && bestMove <= 3);
    });

    test('chooseBestLudoMove() returns null when no legal move is possible', () => {
      const pawns = {
        red: [-1, -1, -1, -1],
        green: [-1, -1, -1, -1],
        yellow: [-1, -1, -1, -1],
        blue: [-1, -1, -1, -1],
      };
      const move = chooseBestLudoMove('red', pawns, 4); // Cannot move from base with 4
      assert.strictEqual(move, null);
    });

    test('chooseBestLudoMove() prioritizes capturing an opponent pawn', () => {
      // Red pawn at relative step 2 (abs 2).
      // Green start is abs 13. Green pawn at abs 6 (rel 45 for green? No, abs = (13 + x) % 52).
      // Let's place Red pawn at step 10. If roll is 4, target is step 14.
      // Abs for Red step 14 is 14.
      // Green pawn at abs 14 (Green start is 13, so relative step 1 for Green).
      const pawns = {
        red: [10, 0, -1, -1], // Pawn 0 is at 10, Pawn 1 is at 0
        green: [1, -1, -1, -1], // Green Pawn 0 is at abs (13+1) = 14
        yellow: [-1, -1, -1, -1],
        blue: [-1, -1, -1, -1],
      };

      // If roll is 4:
      // Pawn 0 moves 10 + 4 = 14 -> lands on abs 14 -> captures Green!
      // Pawn 1 moves 0 + 4 = 4 -> lands on abs 4 -> no capture.
      const bestMove = chooseBestLudoMove('red', pawns, 4);
      assert.strictEqual(bestMove, 0, 'Bot should pick pawn 0 to capture opponent');
    });

    test('chooseBestLudoMove() prioritizes entering home core (step 57)', () => {
      const pawns = {
        red: [54, 20, -1, -1], // Pawn 0 needs 3 to enter core
        green: [-1, -1, -1, -1],
        yellow: [-1, -1, -1, -1],
        blue: [-1, -1, -1, -1],
      };
      const bestMove = chooseBestLudoMove('red', pawns, 3);
      assert.strictEqual(bestMove, 0, 'Bot should pick pawn 0 to reach home core');
    });
  });

  // ==========================================
  // Section 3: Neon Tic Tac Toe Minimax AI
  // ==========================================
  describe('3. Neon Tic Tac Toe Minimax AI', () => {
    test('checkTTTWinner() detects horizontal, vertical, diagonal, and tie', () => {
      const rowWin: TTTSquare[] = ['X', 'X', 'X', null, 'O', null, 'O', null, null];
      assert.strictEqual(checkTTTWinner(rowWin)?.winner, 'X');

      const colWin: TTTSquare[] = ['O', 'X', null, 'O', 'X', null, 'O', null, null];
      assert.strictEqual(checkTTTWinner(colWin)?.winner, 'O');

      const diagWin: TTTSquare[] = ['X', 'O', null, null, 'X', 'O', null, null, 'X'];
      assert.strictEqual(checkTTTWinner(diagWin)?.winner, 'X');

      const tie: TTTSquare[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      assert.strictEqual(checkTTTWinner(tie)?.winner, 'Tie');
    });

    test('Minimax AI blocks opponent from winning on next turn', () => {
      // X has 0 and 1, threatening 2. AI plays 'O' and must pick 2!
      const board: TTTSquare[] = ['X', 'X', null, null, 'O', null, null, null, null];
      const move = getTTTAIMove(board, 'hard');
      assert.strictEqual(move, 2, 'Unbeatable bot must block X at index 2');
    });

    test('Minimax AI takes winning move when available', () => {
      // O has 3 and 4, threatening 5 to win immediately!
      const board: TTTSquare[] = ['X', 'X', null, 'O', 'O', null, 'X', null, null];
      const move = getTTTAIMove(board, 'hard');
      assert.strictEqual(move, 5, 'Bot must take winning index 5');
    });
  });

  // ==========================================
  // Section 4: Cyber Connect Four AI
  // ==========================================
  describe('4. Cyber Connect Four Engine & Heuristic AI', () => {
    test('createEmptyGrid() creates 6x7 matrix of nulls', () => {
      const grid = createEmptyGrid();
      assert.strictEqual(grid.length, 6);
      assert.strictEqual(grid[0].length, 7);
      assert.ok(grid.every((row) => row.every((c) => c === null)));
    });

    test('getDropRow() obeys gravity correctly', () => {
      const grid = createEmptyGrid();
      assert.strictEqual(getDropRow(grid, 3), 5); // bottom row
      grid[5][3] = 'red';
      assert.strictEqual(getDropRow(grid, 3), 4); // row above
    });

    test('checkC4Winner() detects horizontal, vertical, and diagonal wins', () => {
      // Horizontal win
      const hGrid = createEmptyGrid();
      hGrid[5][0] = 'red';
      hGrid[5][1] = 'red';
      hGrid[5][2] = 'red';
      hGrid[5][3] = 'red';
      assert.strictEqual(checkC4Winner(hGrid)?.winner, 'red');

      // Vertical win
      const vGrid = createEmptyGrid();
      vGrid[5][2] = 'cyan';
      vGrid[4][2] = 'cyan';
      vGrid[3][2] = 'cyan';
      vGrid[2][2] = 'cyan';
      assert.strictEqual(checkC4Winner(vGrid)?.winner, 'cyan');

      // Diagonal win
      const dGrid = createEmptyGrid();
      dGrid[5][0] = 'red';
      dGrid[4][1] = 'red';
      dGrid[3][2] = 'red';
      dGrid[2][3] = 'red';
      assert.strictEqual(checkC4Winner(dGrid)?.winner, 'red');
    });

    test('Connect Four Bot blocks opponent 4-in-a-row threat', () => {
      const grid = createEmptyGrid();
      // Red has 3 in a row at bottom (cols 0, 1, 2)
      grid[5][0] = 'red';
      grid[5][1] = 'red';
      grid[5][2] = 'red';
      // Bot is 'cyan', must block at col 3!
      const botMove = getC4AIMove(grid, 'hard');
      assert.strictEqual(botMove, 3, 'Bot must block column 3 to prevent Red from winning');
    });

    test('Connect Four Bot takes immediate win when 3 in a row', () => {
      const grid = createEmptyGrid();
      // Cyan (bot) has 3 in a row at cols 1, 2, 3
      grid[5][1] = 'cyan';
      grid[5][2] = 'cyan';
      grid[5][3] = 'cyan';
      // Col 0 or 4 will win. Col 4 is preferred
      const botMove = getC4AIMove(grid, 'hard');
      assert.ok(botMove === 0 || botMove === 4, 'Bot must take winning move');
    });
  });
});
