import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const meta = JSON.parse(readFileSync('e2e/.auth/meta.json', 'utf8')) as {
  sessionId: string;
  supabaseUrl: string;
  serviceKey: string;
  email: string;
  password: string;
};

async function login(page: import('@playwright/test').Page) {
  await page.goto('login');
  await page.locator('#email').fill(meta.email);
  await page.locator('#password').fill(meta.password);
  await page.getByTestId('test-login').click();
  await page.waitForURL(/\/mountain-athlete-os\/?$/, { timeout: 20_000 });
}

async function fetchSetLogs(sessionId: string) {
  const res = await fetch(
    `${meta.supabaseUrl}/rest/v1/set_logs?session_id=eq.${sessionId}&select=client_id,exercise_id,set_no,weight_kg,reps,rpe,is_dropset,pain&order=logged_at.asc`,
    {
      headers: {
        apikey: meta.serviceKey,
        Authorization: `Bearer ${meta.serviceKey}`,
      },
    },
  );
  if (!res.ok) throw new Error(`set_logs fetch failed: ${res.status}`);
  return (await res.json()) as Array<{
    client_id: string | null;
    exercise_id: string;
    set_no: number;
    weight_kg: number | null;
    reps: number | null;
    rpe: number | null;
    is_dropset: boolean;
    pain: { region?: string } | null;
  }>;
}

async function skipRestIfVisible(page: import('@playwright/test').Page) {
  const skip = page.getByRole('button', { name: 'Skip' });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
}

test('offline workout logs sync to Supabase without duplicates', async ({ page, context }) => {
  await login(page);
  await page.goto(`train/log/${meta.sessionId}`);
  await expect(page.getByTestId('complete-set')).toBeVisible({ timeout: 60_000 });

  await page.getByTestId('complete-set').click();
  await skipRestIfVisible(page);

  await context.setOffline(true);
  await page.waitForTimeout(500);

  for (let i = 0; i < 3; i += 1) {
    await page.getByTestId('complete-set').click();
    await skipRestIfVisible(page);
  }

  await page.getByRole('tab', { name: 'A2' }).click();
  await page.getByTestId('complete-set').click();
  await skipRestIfVisible(page);

  await page.getByTestId('dropset').click();
  await skipRestIfVisible(page);

  await page.getByTestId('log-pain').click();
  await page.getByTestId('pain-region-knee').click();
  await skipRestIfVisible(page);

  await context.setOffline(false);
  await page.waitForTimeout(1000);

  await expect(page.getByText(/waiting to sync/i)).toBeHidden({ timeout: 45_000 });

  const rows = await fetchSetLogs(meta.sessionId);
  expect(rows.length).toBeGreaterThanOrEqual(6);

  const clientIds = rows.map((r) => r.client_id).filter(Boolean);
  expect(new Set(clientIds).size).toBe(clientIds.length);

  expect(rows.some((r) => r.is_dropset)).toBe(true);
  expect(rows.some((r) => r.pain?.region === 'knee')).toBe(true);
  expect(rows.some((r) => r.exercise_id === 'barbell-row')).toBe(true);

  const countBefore = rows.length;
  await page.reload();
  await expect(page.getByText(/waiting to sync/i)).toBeHidden({ timeout: 30_000 });

  const rowsAfter = await fetchSetLogs(meta.sessionId);
  expect(rowsAfter.length).toBe(countBefore);
});
