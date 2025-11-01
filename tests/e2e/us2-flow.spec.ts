import { test, expect } from '@playwright/test';

// US2: Track Application Lifecycle (notes, interviews, feedback)
// Smoke test to ensure a stable page loads for future UI interactions.

test('US2 smoke: personal page loads', async ({ page, baseURL }) => {
  await page.goto(`${baseURL ?? ''}/personal`, { waitUntil: 'load' });
  await expect(page.locator('body')).toBeVisible();
});
