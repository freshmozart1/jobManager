import { test, expect } from '@playwright/test';

// US1: Review & Act on Relevant Jobs
// Minimal smoke test to verify the runner and app boot.
// Detailed flow steps (filter → generate → download → apply) will be added as features land.

test('US1 smoke: search page loads', async ({ page, baseURL }) => {
    await page.goto(`${baseURL ?? ''}/search`, { waitUntil: 'load' });
    await expect(page.locator('body')).toBeVisible();
});
