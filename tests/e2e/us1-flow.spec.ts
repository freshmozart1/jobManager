import { test, expect } from '@playwright/test';

// US1: Review & Act on Relevant Jobs
// Minimal smoke test to verify the runner and app boot.
// Detailed flow steps (filter → generate → download → apply) will be added as features land.

test('US1 smoke: search page loads', async ({ page, baseURL }) => {
    await page.goto(`${baseURL ?? ''}/search`, { waitUntil: 'load' });
    await expect(page.locator('body')).toBeVisible();
});

test.skip('US1 end-to-end: filter → generate → download → apply', async ({ page, baseURL }) => {
    // Placeholder for the full journey once APIs are implemented.
    // Steps (to be filled):
    // 1) Trigger relevance filter (UI action) and wait for segmented list
    // 2) Open a job detail
    // 3) Generate application artifacts (cover letter + CV)
    // 4) Download artifact(s)
    // 5) Mark job as applied and verify status
});
