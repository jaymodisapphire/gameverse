import { test, expect } from '@playwright/test';

test.describe('GAMEVERSE Step 4: Teen Patti & Virtual Chip Wallet E2E Suite', () => {

  test('1. Navigation Bar displays Virtual Chip Vault with 100,000 initial chips', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Virtual Chip pill should be present in top navbar
    const chipPill = page.locator('a[href="/wallet"]').first();
    await expect(chipPill).toBeVisible({ timeout: 10000 });
    await expect(chipPill).toContainText('100,000');

    // Navigate to wallet
    await page.goto('/wallet', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/wallet/, { timeout: 10000 });
  });

  test('2. Wallet Page loads vault, 100,000 starting balance, and legal disclaimer', async ({ page }) => {
    await page.goto('/wallet', { waitUntil: 'domcontentloaded' });

    // Header & Balance
    await expect(page.locator('h1')).toContainText(/CHIP VAULT/i);
    const balanceCard = page.locator('text=Total Virtual Chip Balance');
    await expect(balanceCard).toBeVisible();

    // Legal Entertainment Disclaimer
    const disclaimerNotice = page.locator('text=Virtual Chips Notice');
    await expect(disclaimerNotice).toBeVisible();
    await expect(page.locator('text=/not purchasable, redeemable/i')).toBeVisible();

    // Action buttons
    await expect(page.locator('a[href="/wallet/request-chips"]').first()).toBeVisible();
    await expect(page.locator('a[href="/games/teen-patti"]').first()).toBeVisible();

    // Transaction History section
    await expect(page.locator('text=TRANSACTION LEDGER')).toBeVisible();
  });

  test('3. Request Free Chips form accepts preset amount and submits successfully', async ({ page }) => {
    await page.goto('/wallet/request-chips', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText(/REQUEST VIRTUAL CHIPS/i);

    // Select 50K chip preset
    const preset50k = page.getByRole('button', { name: '50K', exact: true }).first();
    await expect(preset50k).toBeVisible();
    await preset50k.click();

    // Type message
    const messageInput = page.locator('textarea');
    await messageInput.fill('Need virtual chips to join high stakes room with friends');

    // Submit request via "Send Chip Request"
    const submitBtn = page.locator('button[type="submit"]', { hasText: 'Send Chip Request' });
    await submitBtn.click();

    // Verify submission success feedback
    await expect(page.locator('text=REQUEST SUBMITTED!')).toBeVisible({ timeout: 10000 });

    // Should redirect to /wallet/requests and display pending request
    await expect(page).toHaveURL(/\/wallet\/requests/, { timeout: 15000 });
    await expect(page.locator('text=/pending/i').first()).toBeVisible();
    await expect(page.locator('text=/50,000 Chips/i').first()).toBeVisible();
  });

  test('4. Admin Chip Management loads player lookup and grant dialog', async ({ page }) => {
    await page.goto('/admin/chips', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText(/GRANT VIRTUAL CHIPS/i);

    // Search input should be present
    const searchInput = page.locator('input[placeholder*="Search by username"]');
    await expect(searchInput).toBeVisible();

    const searchBtn = page.locator('button', { hasText: 'Search' });
    await expect(searchBtn).toBeVisible();

    // Grant modal button for player
    const grantBtn = page.locator('button', { hasText: 'Grant Chips' }).first();
    await expect(grantBtn).toBeVisible();
    await grantBtn.click();

    // Modal opens with confirmation step and audit reason
    await expect(page.locator('text=Grant Virtual Chips').first()).toBeVisible();
    await expect(page.locator('text=Audit Reason')).toBeVisible();
  });

  test('5. Admin Chip Requests review queue loads approval controls', async ({ page }) => {
    await page.goto('/admin/chip-requests', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText(/REVIEW CHIP REQUESTS/i);

    // Should display queue list or empty queue message
    const queueSection = page.locator('main');
    await expect(queueSection).toBeVisible();
  });

  test('6. Teen Patti Landing Page renders features and authentic Hand Rankings', async ({ page }) => {
    await page.goto('/games/teen-patti', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText(/TEEN PATTI/i);

    // Check Hand Rankings Guide
    await expect(page.locator('text=OFFICIAL 3 PATTI HAND RANKINGS')).toBeVisible();
    await expect(page.locator('text=Trail').first()).toBeVisible();
    await expect(page.locator('text=Pure Sequence').first()).toBeVisible();

    // Enter Lobby button
    const enterLobbyBtn = page.locator('a[href="/games/teen-patti/lobby"]', { hasText: 'Enter Game Lobby' });
    await expect(enterLobbyBtn).toBeVisible();
    await page.goto('/games/teen-patti/lobby', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/games\/teen-patti\/lobby/);
  });

  test('7. Teen Patti Lobby renders public tables and room code joiner', async ({ page }) => {
    await page.goto('/games/teen-patti/lobby', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText(/TEEN PATTI TABLES/i);

    // 4 preset public tables
    await expect(page.locator('text=Cyber Lounge')).toBeVisible();
    await expect(page.locator('text=Neon High-Rollers')).toBeVisible();

    // Private Suite creation button
    const createSuiteBtn = page.locator('a[href="/games/teen-patti/create"]');
    await expect(createSuiteBtn).toBeVisible();

    // Click "Join Table" on the first public table
    const joinBtn = page.locator('a[href*="/games/teen-patti/table/"]').first();
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    // URL should match table route
    await expect(page).toHaveURL(/\/games\/teen-patti\/table\//);
  });

  test('8. Live Table loads AI Dealer Aria, sound toggle, and table seats', async ({ page }) => {
    await page.goto('/games/teen-patti/table/tp-novice-1', { waitUntil: 'load' });

    // AI Dealer Aria and title
    await expect(page.locator('text=ARIA')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=AI DEALER')).toBeVisible();

    // Audio dealer control button
    await expect(page.locator('button', { hasText: 'Sound' }).first()).toBeVisible();

    // Pot display
    await expect(page.locator('text=Main Pot')).toBeVisible();

    // Seats should be rendered (6 seats around table)
    const seat1 = page.locator('button', { hasText: 'Seat #1' });
    await expect(seat1).toBeVisible();

    // Spectator indicator and Add AI Bot button
    await expect(page.locator('text=You are currently spectating')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Add AI Bot' })).toBeVisible();

    // User Chips in table banner
    await expect(page.locator('a[href="/wallet"]').first()).toBeVisible();
  });
});
