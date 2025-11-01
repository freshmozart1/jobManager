import { test, expect, request } from '@playwright/test';

// Contract: GET /api/jobs/{id} returns 200 with an array (empty or 1 item)

const NON_EXISTENT_ID = 'job-does-not-exist-12345';

test('GET /api/jobs/{id} returns 200 and array', async ({ baseURL }) => {
  const api = await request.newContext({ baseURL });
  const res = await api.get(`/api/jobs/${NON_EXISTENT_ID}`);
  expect(res.status(), await res.text()).toBe(200);
  const data = await res.json();
  expect(Array.isArray(data)).toBeTruthy();
});
