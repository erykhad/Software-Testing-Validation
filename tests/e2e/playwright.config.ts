import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  globalSetup: './global-setup.ts',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter @shopping/api start',
      url: 'http://127.0.0.1:3000/api/health',
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ...process.env,
        PORT: '3000',
        DB_PATH: './data/e2e.sqlite',
        NODE_ENV: 'development',
      },
    },
    {
      command: 'pnpm --filter @shopping/web dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
