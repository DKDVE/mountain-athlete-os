import { defineConfig, devices } from '@playwright/test';

const basePath = '/mountain-athlete-os';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:4173${basePath}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'pnpm --filter @maos/web build && pnpm --filter @maos/web preview --port 4173 --strictPort',
    url: `http://127.0.0.1:4173${basePath}/`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_APP_BASE_PATH: basePath,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
    },
  },
});
