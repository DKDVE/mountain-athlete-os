import { test, expect } from '@playwright/test';

test('landing page loads MAOS heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /MAOS — online/i })).toBeVisible();
});
