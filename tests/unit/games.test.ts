import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOG_GAMES,
  GAME_CATEGORIES,
  getGameBySlug,
  getGamesByCategory,
  searchGames,
  createGameEngine,
} from '../../src/lib/games/registry';
import { validateScoreIntegrity } from '../../src/lib/games/sessions';
import { NeonSnakeEngine } from '../../src/lib/games/neon-snake';
import { SpaceDefenderEngine } from '../../src/lib/games/space-defender';
import { NeonRacerEngine } from '../../src/lib/games/neon-racer';

test('--- Unit Test Suite: Game Catalog & Registry ---', async (t) => {
  await t.test('1. CATALOG_GAMES contains all core playable games with valid metadata', () => {
    assert.ok(CATALOG_GAMES.length >= 5, 'Expected at least 5 games in catalog');

    const expectedSlugs = ['neon-snake', 'space-defender', 'neon-racer', 'ludo', 'tic-tac-toe'];
    for (const slug of expectedSlugs) {
      const game = CATALOG_GAMES.find((g) => g.slug === slug);
      assert.ok(game, `Expected game with slug ${slug} to be present in catalog`);
      assert.ok(game.title && game.title.length > 0, `Game ${slug} must have a title`);
      assert.ok(game.description && game.description.length > 0, `Game ${slug} must have a description`);
      assert.ok(game.instructions && game.instructions.length > 0, `Game ${slug} must have instructions`);
      assert.ok(game.category && game.category.length > 0, `Game ${slug} must have a category`);
      assert.ok(game.accentColor.startsWith('#'), `Game ${slug} must have a hex accentColor`);
      assert.ok(game.supportedInputs.length > 0, `Game ${slug} must specify supportedInputs`);
      assert.ok(game.rating >= 4.0 && game.rating <= 5.0, `Game ${slug} rating must be between 4.0 and 5.0`);
    }
  });

  await t.test('2. getGameBySlug() returns matching game or undefined', () => {
    const snake = getGameBySlug('neon-snake');
    assert.ok(snake);
    assert.equal(snake?.title, 'Neon Snake');
    assert.equal(snake?.category, 'arcade');

    const defender = getGameBySlug('space-defender');
    assert.ok(defender);
    assert.equal(defender?.title, 'Space Defender');
    assert.equal(defender?.category, 'action');

    const racer = getGameBySlug('neon-racer');
    assert.ok(racer);
    assert.equal(racer?.title, 'Neon Racer');
    assert.equal(racer?.category, 'racing');

    const nonExistent = getGameBySlug('non-existent-game-slug');
    assert.equal(nonExistent, undefined);
  });

  await t.test('3. GAME_CATEGORIES contains expected category slugs and names', () => {
    const slugs = GAME_CATEGORIES.map((c) => c.slug);
    assert.ok(slugs.includes('all'));
    assert.ok(slugs.includes('arcade'));
    assert.ok(slugs.includes('action'));
    assert.ok(slugs.includes('racing'));
    assert.ok(slugs.includes('classic'));
  });

  await t.test('4. getGamesByCategory() correctly filters games', () => {
    const all = getGamesByCategory('all');
    assert.equal(all.length, CATALOG_GAMES.length);

    const arcade = getGamesByCategory('arcade');
    assert.ok(arcade.some((g) => g.slug === 'neon-snake'));
    assert.ok(!arcade.some((g) => g.slug === 'space-defender'));

    const action = getGamesByCategory('action');
    assert.ok(action.some((g) => g.slug === 'space-defender'));

    const racing = getGamesByCategory('racing');
    assert.ok(racing.some((g) => g.slug === 'neon-racer'));
  });

  await t.test('5. searchGames() filters by title, tags, and category', () => {
    // Search by title
    const searchSnake = searchGames('snake');
    assert.equal(searchSnake.length, 1);
    assert.equal(searchSnake[0].slug, 'neon-snake');

    // Case-insensitivity
    const searchUpper = searchGames('DEFENDER');
    assert.equal(searchUpper.length, 1);
    assert.equal(searchUpper[0].slug, 'space-defender');

    // Search by tag
    const searchTag = searchGames('cyberpunk');
    assert.ok(searchTag.length >= 2);
    assert.ok(searchTag.some((g) => g.slug === 'neon-snake'));
    assert.ok(searchTag.some((g) => g.slug === 'neon-racer'));

    // Combined query and category
    const searchWithCategory = searchGames('neon', 'racing');
    assert.equal(searchWithCategory.length, 1);
    assert.equal(searchWithCategory[0].slug, 'neon-racer');

    // Query yielding no results
    const noResults = searchGames('completely_random_nonexistent_keyword');
    assert.equal(noResults.length, 0);
  });
});

test('--- Unit Test Suite: Anti-Cheat & Score Physics Validation ---', async (t) => {
  await t.test('1. Rejects negative scores or durations', () => {
    const negScore = validateScoreIntegrity('neon-snake', -50, 30);
    assert.equal(negScore.valid, false);
    assert.ok(negScore.reason?.includes('Negative'));

    const negDuration = validateScoreIntegrity('neon-snake', 100, -5);
    assert.equal(negDuration.valid, false);
    assert.ok(negDuration.reason?.includes('Negative'));
  });

  await t.test('2. Allows valid realistic scores for Neon Snake', () => {
    // Score of 150 points in 30 seconds (5 pts/s) -> well within 50 pts/s threshold
    const validRun = validateScoreIntegrity('neon-snake', 150, 30);
    assert.equal(validRun.valid, true);

    // Score of 0 in 5 seconds (player died immediately)
    const zeroRun = validateScoreIntegrity('neon-snake', 0, 5);
    assert.equal(zeroRun.valid, true);
  });

  await t.test('3. Rejects physically impossible speedhacked scores for Neon Snake', () => {
    // 5,000 points in 10 seconds -> rate is 500 pts/s (limit is 50 pts/s, max is 500)
    const hackedRun = validateScoreIntegrity('neon-snake', 5000, 10);
    assert.equal(hackedRun.valid, false);
    assert.ok(hackedRun.reason?.includes('exceeds maximum calculated physics limit'));

    // 100,000 points in 20 seconds
    const extremeHacked = validateScoreIntegrity('neon-snake', 100000, 20);
    assert.equal(extremeHacked.valid, false);
  });

  await t.test('4. Allows and restricts Space Defender scoring appropriately', () => {
    // 500 points in 10 seconds (50 pts/s) -> within 120 pts/s limit
    const validDefender = validateScoreIntegrity('space-defender', 500, 10);
    assert.equal(validDefender.valid, true);

    // 2,500 points in 10 seconds -> exceeds 10 * 120 = 1200
    const hackedDefender = validateScoreIntegrity('space-defender', 2500, 10);
    assert.equal(hackedDefender.valid, false);
    assert.ok(hackedDefender.reason?.includes('exceeds maximum calculated physics limit'));
  });

  await t.test('5. Allows and restricts Neon Racer scoring appropriately', () => {
    // 400 points in 10 seconds -> within 10 * 80 = 800 limit
    const validRacer = validateScoreIntegrity('neon-racer', 400, 10);
    assert.equal(validRacer.valid, true);

    // 1,500 points in 10 seconds -> exceeds 800 limit
    const hackedRacer = validateScoreIntegrity('neon-racer', 1500, 10);
    assert.equal(hackedRacer.valid, false);
  });

  await t.test('6. Base buffer allows low scores even with short durations', () => {
    // Minimum 100 base buffer allows scores up to 100 in 1 second
    const quickScore = validateScoreIntegrity('neon-snake', 75, 1);
    assert.equal(quickScore.valid, true);

    const impossibleQuick = validateScoreIntegrity('neon-snake', 150, 1);
    assert.equal(impossibleQuick.valid, false);
  });
});

test('--- Unit Test Suite: Game Engines & Factory ---', async (t) => {
  await t.test('1. NeonSnakeEngine implements required GameEngine methods', () => {
    const engine = new NeonSnakeEngine();
    assert.ok(engine);
    assert.equal(typeof engine.init, 'function');
    assert.equal(typeof engine.start, 'function');
    assert.equal(typeof engine.pause, 'function');
    assert.equal(typeof engine.resume, 'function');
    assert.equal(typeof engine.restart, 'function');
    assert.equal(typeof engine.destroy, 'function');
    assert.equal(typeof engine.handleInput, 'function');
    assert.equal(typeof engine.setSoundEnabled, 'function');
  });

  await t.test('2. SpaceDefenderEngine implements required GameEngine methods', () => {
    const engine = new SpaceDefenderEngine();
    assert.ok(engine);
    assert.equal(typeof engine.init, 'function');
    assert.equal(typeof engine.start, 'function');
    assert.equal(typeof engine.pause, 'function');
    assert.equal(typeof engine.resume, 'function');
    assert.equal(typeof engine.restart, 'function');
    assert.equal(typeof engine.destroy, 'function');
    assert.equal(typeof engine.handleInput, 'function');
    assert.equal(typeof engine.setSoundEnabled, 'function');
  });

  await t.test('3. NeonRacerEngine implements required GameEngine methods', () => {
    const engine = new NeonRacerEngine();
    assert.ok(engine);
    assert.equal(typeof engine.init, 'function');
    assert.equal(typeof engine.start, 'function');
    assert.equal(typeof engine.pause, 'function');
    assert.equal(typeof engine.resume, 'function');
    assert.equal(typeof engine.restart, 'function');
    assert.equal(typeof engine.destroy, 'function');
    assert.equal(typeof engine.handleInput, 'function');
    assert.equal(typeof engine.setSoundEnabled, 'function');
  });

  await t.test('4. createGameEngine() factory instantiates correct engine or returns null', () => {
    const snake = createGameEngine('neon-snake');
    assert.ok(snake instanceof NeonSnakeEngine);

    const defender = createGameEngine('space-defender');
    assert.ok(defender instanceof SpaceDefenderEngine);

    const racer = createGameEngine('neon-racer');
    assert.ok(racer instanceof NeonRacerEngine);

    const unknown = createGameEngine('non-canvas-slug');
    assert.equal(unknown, null);
  });
});
