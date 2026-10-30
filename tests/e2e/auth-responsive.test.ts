import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '320px Mobile (Compact)', width: 320, height: 600 },
  { name: '375px Mobile (iPhone)', width: 375, height: 667 },
  { name: '430px Mobile (Large)', width: 430, height: 932 },
  { name: '768px Tablet (iPad)', width: 768, height: 1024 },
  { name: '1024px Laptop', width: 1024, height: 768 },
  { name: '1440px Desktop', width: 1440, height: 900 },
  { name: '1920px Large Desktop', width: 1920, height: 1080 },
];

test.describe('GameVerse Authentication Visual & Responsive Suite', () => {
  for (const vp of VIEWPORTS) {
    test(`Login Page renders properly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/auth/login');

      // Verify header / brand exists
      const brandLogo = page.locator('text=GAMEVERSE');
      await expect(brandLogo.first()).toBeVisible();

      // Verify email & password fields are rendered
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();

      // Verify Sign In submit button is clickable and visible
      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeVisible();

      // Verify Google OAuth button is visible
      const googleBtn = page.locator('text=Continue with Google');
      await expect(googleBtn).toBeVisible();

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin for sub-pixel rendering
    });

    test(`Signup Page renders properly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/auth/signup');

      // Verify inputs
      await expect(page.locator('input[placeholder="CyberKnight_99"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });
  }
});
