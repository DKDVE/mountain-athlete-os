import { defineConfig } from 'vitest/config';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ponytail: load monorepo root .env for local integration tests without dotenv package
const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const envPath = resolve(import.meta.dirname, '../../.env');
if (!isCi && existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    hookTimeout: 60000,
  },
});
