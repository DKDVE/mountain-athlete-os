import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

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
    // ponytail: optional .env for local e2e
  }
}

async function restDelete(url: string, serviceKey: string, table: string, filter: string) {
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status}`);
}

async function restPatch(
  url: string,
  serviceKey: string,
  table: string,
  filter: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed: ${res.status}`);
}

async function restGet<T>(url: string, serviceKey: string, table: string, filter: string): Promise<T> {
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return (await res.json()) as T;
}

export default async function globalSetup() {
  loadEnvFile();

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('E2E requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const email = process.env.MAOS_SEED_EMAIL ?? 'seed@maos.local';
  const password = process.env.MAOS_SEED_PASSWORD ?? 'seedpass123';

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 2);
  const startStr = start.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const seed = spawnSync('pnpm', ['seed'], {
    cwd: 'packages/shared',
    env: {
      ...process.env,
      SUPABASE_URL: url,
      SUPABASE_SERVICE_ROLE_KEY: serviceKey,
      MAOS_PROGRAM_START: startStr,
      MAOS_SEED_ENV: 'dev',
      MAOS_SEED_EMAIL: email,
      MAOS_SEED_PASSWORD: password,
    },
    encoding: 'utf8',
  });
  if (seed.status !== 0) {
    throw new Error(seed.stderr || 'Seed failed for e2e');
  }
  const jsonStart = seed.stdout.indexOf('{');
  if (jsonStart < 0) throw new Error('Seed did not output JSON');
  const summary = JSON.parse(seed.stdout.slice(jsonStart)) as { userId: string };

  const sessions = await restGet<Array<{ id: string; title: string }>>(
    url,
    serviceKey,
    'sessions',
    `user_id=eq.${summary.userId}&date=eq.${todayStr}&title=eq.Upper&select=id,title`,
  );
  const session = sessions[0];
  if (!session) throw new Error(`No Upper session on ${todayStr} for e2e`);

  await restDelete(url, serviceKey, 'set_logs', `session_id=eq.${session.id}`);
  await restPatch(url, serviceKey, 'sessions', `id=eq.${session.id}`, {
    status: 'upcoming',
    session_rpe: null,
    energy: null,
    pump: null,
    finished_at: null,
    started_at: null,
  });

  mkdirSync('e2e/.auth', { recursive: true });
  writeFileSync(
    'e2e/.auth/meta.json',
    JSON.stringify({
      sessionId: session.id,
      userId: summary.userId,
      today: todayStr,
      supabaseUrl: url,
      serviceKey,
      email,
      password,
    }),
  );
}
