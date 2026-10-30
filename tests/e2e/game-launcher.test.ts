import { test, expect } from '@playwright/test';

test.describe('GameVerse Step 3: Game Discovery & In-Browser Launcher Suite', () => {
  test('1. Game Discovery Portal loads catalog, search and category filters work', async ({ page }) => {
    await page.goto('/games');

    // Page title and heading
    await expect(page.locator('h1:has-text("EXPLORE THE")')).toBeVisible();

    // Verify category tabs exist
    const arcadeTab = page.locator('button:has-text("Arcade")');
    await expect(arcadeTab).toBeVisible();

    // Verify search input
    const searchInput = page.locator('input[placeholder*="Search games"]');
    await expect(searchInput).toBeVisible();

    // Test Search filtering
    await searchInput.fill('snake');
    await expect(page.locator('text=Neon Snake').first()).toBeVisible();
    await expect(page.locator('text=Space Defender')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('text=Space Defender').first()).toBeVisible();

    // Test Category filter
    const racingTab = page.locator('button:has-text("Racing")');
    await racingTab.click();
    await expect(page.locator('text=Neon Racer').first()).toBeVisible();
    await expect(page.locator('text=Neon Snake')).not.toBeVisible();

    // Return to All Games
    const allTab = page.locator('button:has-text("All Games")');
    await allTab.click();
    await expect(page.locator('text=Neon Snake').first()).toBeVisible();
    await expect(page.locator('text=Space Defender').first()).toBeVisible();
  });

  test('2. Neon Snake launcher loads live canvas, HUD, instructions and controls', async ({ page }) => {
    await page.goto('/play/neon-snake');

    // Canvas should be rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // HUD elements in header
    const scoreLabel = page.locator('header').locator('text=SCORE');
    await expect(scoreLabel).toBeVisible();

    const bestLabel = page.locator('header').locator('text=BEST:');
    await expect(bestLabel).toBeVisible();

    // Controls: Mute, Pause, Restart, Fullscreen
    const restartBtn = page.locator('button[title="Restart Game"]');
    await expect(restartBtn).toBeVisible();

    const pauseBtn = page.locator('button[title="Pause Game"]');
    await expect(pauseBtn).toBeVisible();

    const muteBtn = page.locator('button[title*="Audio"]');
    await expect(muteBtn).toBeVisible();

    // Test mute toggle
    await muteBtn.click();
    await expect(page.locator('button[title="Unmute Audio"]')).toBeVisible();

    // Test pause toggle
    await pauseBtn.click();
    await expect(page.locator('text=GAME PAUSED')).toBeVisible();
    const resumeBtn = page.locator('button:has-text("Resume Match")');
    await resumeBtn.click();
    await expect(page.locator('text=GAME PAUSED')).not.toBeVisible();

    // Instructions and Game Details
    await expect(page.locator('text=ABOUT NEON SNAKE')).toBeVisible();
    await expect(page.locator('text=How to Play')).toBeVisible();
  });

  test('3. Space Defender loads live canvas and action shooter interface', async ({ page }) => {
    await page.goto('/play/space-defender');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    await expect(page.locator('text=ABOUT SPACE DEFENDER')).toBeVisible();
    await expect(page.locator('header').locator('text=SCORE')).toBeVisible();
    await expect(page.locator('button[aria-label="Fire Plasma"]')).toBeVisible();
  });

  test('4. Neon Racer loads live canvas and highway arcade interface', async ({ page }) => {
    await page.goto('/play/neon-racer');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    await expect(page.locator('text=ABOUT NEON RACER')).toBeVisible();
    await expect(page.locator('header').locator('text=SCORE')).toBeVisible();
    await expect(page.locator('button[aria-label="Nitro Boost"]')).toBeVisible();
  });

  test('5. Mobile viewports display touch controls and fit without overflow', async ({ page }) => {
    const mobileViewports = [
      { name: '375px iPhone', width: 375, height: 667 },
      { name: '430px Large Mobile', width: 430, height: 932 },
    ];

    for (const vp of mobileViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/play/neon-snake');

      // Verify canvas rendered
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 10000 });

      // Verify on-screen touch D-Pad controls are visible
      const touchUp = page.locator('button[aria-label="Move Up"]');
      await expect(touchUp).toBeVisible();

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    }
  });

  test('6. Dashboard renders game arena, session statistics and quick launch cards', async ({ page }) => {
    await page.goto('/dashboard');

    // Dashboard headings and player stats
    await expect(page.locator('h3:has-text("IN-BROWSER GAMES ARENA")')).toBeVisible();
    await expect(page.locator('text=Total Sessions')).toBeVisible();
    await expect(page.locator('text=Best Score')).toBeVisible();

    // Verify quick launch cards for games
    const playSnakeLink = page.locator('a[href="/play/neon-snake"]');
    await expect(playSnakeLink.first()).toBeVisible();

    const playDefenderLink = page.locator('a[href="/play/space-defender"]');
    await expect(playDefenderLink.first()).toBeVisible();

    const playRacerLink = page.locator('a[href="/play/neon-racer"]');
    await expect(playRacerLink.first()).toBeVisible();
  });
});
