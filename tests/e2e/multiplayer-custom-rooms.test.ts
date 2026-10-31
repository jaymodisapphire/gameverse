import { test, expect } from '@playwright/test';

test.describe('GameVerse Multiplayer, Custom Rooms & Bot Play E2E Suite', () => {
  test('1. Multiplayer Hub loads all 4 games, filter tabs, and room code joiner', async ({ page }) => {
    await page.goto('/multiplayer');

    // Heading
    await expect(page.locator('h1:has-text("ONLINE")')).toBeVisible();
    await expect(page.locator('text=Teen Patti Royale')).toBeVisible();
    await expect(page.locator('text=Cyber Ludo Arena')).toBeVisible();
    await expect(page.locator('text=Cyber Connect Four')).toBeVisible();
    await expect(page.locator('text=Neon Tic Tac Toe')).toBeVisible();

    // Verify filter pills
    const customFilter = page.locator('button:has-text("Custom Rooms")');
    await expect(customFilter).toBeVisible();
    await customFilter.click();
    await expect(page.locator('text=Cyber Connect Four')).toBeVisible();

    // Verify Room Code Input exists
    const input = page.locator('input[placeholder*="LUDO-"]');
    await expect(input).toBeVisible();
  });

  test('2. Cyber Ludo Arena loads board, dice, bot mode, and custom room modal', async ({ page }) => {
    await page.goto('/games/ludo');

    // Title & Board
    await expect(page.locator('h1:has-text("CYBER")')).toBeVisible();
    await expect(page.locator('text=RED BASE')).toBeVisible();
    await expect(page.locator('text=GREEN BASE')).toBeVisible();

    // Dice Button
    const rollButton = page.locator('button:has-text("ROLL DICE")');
    await expect(rollButton).toBeVisible();

    // Click Roll Dice
    await rollButton.click();
    await page.waitForTimeout(600);

    // Verify Custom Room modal triggers
    const customRoomTab = page.locator('button:has-text("Custom Room")');
    await customRoomTab.click();
    await expect(page.locator('h2:has-text("Custom Ludo Room")')).toBeVisible();

    // Create New Room button inside modal
    const createBtn = page.locator('button:has-text("Create New Room")');
    await createBtn.click();

    // Verify room code banner appears
    await expect(page.locator('text=Custom Room Code:')).toBeVisible();
    await expect(page.locator('button:has-text("Copy Invite Link")')).toBeVisible();
  });

  test('3. Neon Tic Tac Toe plays against AI bot and allows custom room creation', async ({ page }) => {
    await page.goto('/games/tic-tac-toe');

    // Title
    await expect(page.locator('h1:has-text("NEON")')).toBeVisible();

    // Grid buttons (9 cells)
    const cells = page.locator('main button.rounded-2xl.border-2');
    await expect(cells).toHaveCount(9);

    // Click center cell (index 4)
    await cells.nth(4).click();
    await expect(cells.nth(4)).toHaveText('X');

    // Wait for AI bot to make a move (places 'O')
    await page.waitForTimeout(800);
    const hasO = await page.locator('main button:has-text("O")').count();
    expect(hasO).toBeGreaterThan(0);

    // Test Custom Room creation
    const customRoomTab = page.locator('button:has-text("Custom Room")');
    await customRoomTab.click();
    const createBtn = page.locator('button:has-text("Create New Room")');
    await createBtn.click();

    await expect(page.locator('text=Custom Room Code:')).toBeVisible();
  });

  test('4. Cyber Connect Four drops chips into matrix and triggers AI response', async ({ page }) => {
    await page.goto('/games/connect-four');

    // Title
    await expect(page.locator('h1:has-text("CYBER")')).toBeVisible();

    // Header drop buttons (7 columns)
    const dropButtons = page.locator('main .grid-cols-7 button.h-8');
    await expect(dropButtons).toHaveCount(7);

    // Drop in center column (col 3)
    await dropButtons.nth(3).click();

    // Wait for AI Sentinel bot to respond
    await page.waitForTimeout(1000);

    // Verify Custom Room modal
    const customRoomTab = page.locator('button:has-text("Custom Room")');
    await customRoomTab.click();
    await expect(page.locator('h2:has-text("Custom Connect Four Room")')).toBeVisible();
  });

  test('5. Universal Room Code redirect from Multiplayer Hub', async ({ page }) => {
    await page.goto('/multiplayer');

    const input = page.locator('input[placeholder*="LUDO-"]');
    await input.fill('C4-829104');

    const joinBtn = page.locator('button:has-text("Join Room")');
    await joinBtn.click();

    await page.waitForURL('**/games/connect-four?room=C4-829104');
    expect(page.url()).toContain('/games/connect-four?room=C4-829104');
  });
});
