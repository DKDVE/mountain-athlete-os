import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const meta = JSON.parse(readFileSync('e2e/.auth/meta.json', 'utf8')) as {
  supabaseUrl: string;
  serviceKey: string;
};

const API_BASE = process.env.VITE_API_BASE_URL ?? 'https://maos-api-dkdve.onrender.com';

const AI_FIXTURE = {
  goals: ['strength'],
  experience: 'intermediate',
  constraints: {
    daysPerWeek: 4,
    sessionMinutes: 60,
    equipment: ['barbell', 'rack', 'bench', 'pull_up_bar', 'dumbbell', 'bodyweight', 'outdoor'],
  },
  screening: { flags: [] },
  preferences: { likedMovements: [], dislikedMovements: [] },
  metricsSnapshot: { heightCm: 175, weightKg: 75 },
};

const DUAL_INJURY_FIXTURE = {
  ...AI_FIXTURE,
  goals: ['hybrid_performance'],
  screening: {
    flags: [
      { flag: 'current_injury', region: 'lowBack', note: 'Lower-back pain' },
      { flag: 'current_injury', region: 'shoulder', note: 'Shoulder pain' },
    ],
  },
};

async function createFreshUser(suffix: string) {
  const email = `e2e-onboard-${suffix}-${Date.now()}@maos.local`;
  const password = 'e2e-onboard-pass-123';

  const res = await fetch(`${meta.supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: meta.serviceKey,
      Authorization: `Bearer ${meta.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`create user failed: ${res.status}`);
  const body = (await res.json()) as { id: string };
  return { email, password, userId: body.id };
}

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByTestId('test-login').click();
  await page.waitForURL(/\/onboarding/, { timeout: 20_000 });
}

async function completeManualOnboarding(page: import('@playwright/test').Page, goal = 'hybrid_performance') {
  await page.getByTestId('onboarding-door-manual').click();
  await page.getByTestId(`goal-${goal}`).click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click(); // about (skip)
  await page.getByTestId('exp-intermediate').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click(); // constraints
  await page.getByTestId('onboarding-next').click(); // screening
  await page.getByTestId('onboarding-next').click(); // preferences
  await page.getByTestId('onboarding-finish').click();
  await page.waitForURL(/\/mountain-athlete-os\/?$/, { timeout: 30_000 });
}

test('Door A: sign up → manual onboarding → Today shows Week 1 session', async ({ page }) => {
  const user = await createFreshUser('door-a');
  await login(page, user.email, user.password);
  await completeManualOnboarding(page);
  await page.waitForURL(/\/mountain-athlete-os\/?$/, { timeout: 30_000 });

  const programs = await fetch(
    `${meta.supabaseUrl}/rest/v1/programs?user_id=eq.${user.userId}&active=eq.true&select=id,name`,
    { headers: { apikey: meta.serviceKey, Authorization: `Bearer ${meta.serviceKey}` } },
  ).then((r) => r.json()) as Array<{ id: string; name: string }>;
  expect(programs.length).toBe(1);

  const sessions = await fetch(
    `${meta.supabaseUrl}/rest/v1/sessions?user_id=eq.${user.userId}&select=title&limit=10`,
    { headers: { apikey: meta.serviceKey, Authorization: `Bearer ${meta.serviceKey}` } },
  ).then((r) => r.json()) as Array<{ title: string }>;
  expect(sessions.length).toBeGreaterThanOrEqual(7);
  expect(sessions.some((s) => s.title.includes('Lower A'))).toBe(true);

  await expect(page.getByText(/Week 1|Lower A|Start session|Rest day/i).first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Start session' }).click();
  await expect(page.getByTestId('workout-logger')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /Back Squat|Goblet Squat/i })).toBeVisible();
});

test('Door B: AI parse (mocked) → confirm → Today shows Week 1', async ({ page }) => {
  await page.route(`${API_BASE}/onboarding/parse-profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: { profile: AI_FIXTURE } }),
    });
  });

  const user = await createFreshUser('door-b');
  await login(page, user.email, user.password);
  await page.getByTestId('onboarding-door-ai').click();
  await page.getByTestId('onboarding-ai-text').fill(
    'I want strength for trekking. 4 days a week, barbell and outdoor running. Intermediate lifter.',
  );
  await page.getByTestId('onboarding-ai-submit').click();
  await page.getByTestId('onboarding-ai-confirm').click();
  await page.waitForURL(/\/mountain-athlete-os\/?$/, { timeout: 30_000 });

  const programs = await fetch(
    `${meta.supabaseUrl}/rest/v1/programs?user_id=eq.${user.userId}&active=eq.true&select=id`,
    { headers: { apikey: meta.serviceKey, Authorization: `Bearer ${meta.serviceKey}` } },
  ).then((r) => r.json()) as unknown[];
  expect(programs.length).toBe(1);
});

test('shoulder injury excludes overhead press from generated program', async ({ page }) => {
  const user = await createFreshUser('injury');
  await login(page, user.email, user.password);
  await page.getByTestId('onboarding-door-manual').click();
  await page.getByTestId('goal-strength').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('exp-intermediate').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('screening-current_injury').click();
  await page.getByTestId('injury-region').fill('shoulder');
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-finish').click();
  await page.waitForURL(/\/mountain-athlete-os\/?$/, { timeout: 30_000 });

  const sessions = await fetch(
    `${meta.supabaseUrl}/rest/v1/sessions?user_id=eq.${user.userId}&title=ilike.*Upper*&select=planned,title`,
    { headers: { apikey: meta.serviceKey, Authorization: `Bearer ${meta.serviceKey}` } },
  ).then((r) => r.json()) as Array<{ title: string; planned: { exercises?: Array<{ exerciseId: string }> } }>;

  const upper = sessions[0];
  expect(upper).toBeTruthy();
  const ids = upper?.planned.exercises?.map((e) => e.exerciseId) ?? [];
  expect(ids).not.toContain('overhead-press');
  expect(ids).not.toContain('bench-press');
});

test('Door B dual injury: Start session loads substituted Lower A exercises', async ({ page }) => {
  await page.route(`${API_BASE}/onboarding/parse-profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: { profile: DUAL_INJURY_FIXTURE } }),
    });
  });

  const user = await createFreshUser('door-b-injury');
  await login(page, user.email, user.password);
  await page.getByTestId('onboarding-door-ai').click();
  await page.getByTestId('onboarding-ai-text').fill(
    'Hybrid performance with low back and shoulder issues. 4 days, barbell and dumbbells.',
  );
  await page.getByTestId('onboarding-ai-submit').click();
  await page.getByTestId('onboarding-ai-confirm').click();
  await page.waitForURL(/\/mountain-athlete-os\/?$/, { timeout: 30_000 });

  const sessions = await fetch(
    `${meta.supabaseUrl}/rest/v1/sessions?user_id=eq.${user.userId}&title=eq.Lower%20A&select=planned`,
    { headers: { apikey: meta.serviceKey, Authorization: `Bearer ${meta.serviceKey}` } },
  ).then((r) => r.json()) as Array<{ planned: { exercises?: Array<{ exerciseId: string }> } }>;
  expect((sessions[0]?.planned.exercises?.length ?? 0)).toBeGreaterThan(0);

  await page.getByRole('link', { name: 'Start session' }).click();
  await expect(page.getByTestId('workout-logger')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /Goblet Squat|Hip Thrust/i })).toBeVisible();
});

test('longevity goal shows specialized consult-professional state', async ({ page }) => {
  const user = await createFreshUser('longevity');
  await login(page, user.email, user.password);
  await page.getByTestId('onboarding-door-manual').click();
  await page.getByTestId('goal-longevity').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('exp-beginner').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-next').click();
  await page.getByTestId('onboarding-finish').click();

  await expect(page.getByTestId('specialized-state')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/consult a qualified professional/i)).toBeVisible();
});
