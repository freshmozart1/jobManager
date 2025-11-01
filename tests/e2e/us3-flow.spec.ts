import { test, expect } from '@playwright/test';

// US3: Ingest New Jobs
// Smoke test to ensure admin/playground page loads for future ingestion trigger steps.

test('US3 smoke: playground page loads', async ({ page, baseURL }) => {
  await page.goto(`${baseURL ?? ''}/playground`, { waitUntil: 'load' });
  await expect(page.locator('body')).toBeVisible();
});
