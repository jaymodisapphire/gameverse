import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx next dev -p 4000 -H 127.0.0.1',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
