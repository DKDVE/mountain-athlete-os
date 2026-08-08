import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

const basePath = '/mountain-athlete-os';

function loadEnvFile() {
  try {
    const raw = readFileSync('.env', 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional
  }
}

loadEnvFile();

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:4173${basePath}/`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'pnpm --filter @maos/shared build && pnpm --filter @maos/web build && pnpm --filter @maos/web preview --port 4173 --strictPort',
    url: `http://127.0.0.1:4173${basePath}/`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      VITE_APP_BASE_PATH: basePath,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? '',
      VITE_E2E_TEST_LOGIN: 'true',
    },
  },
});
