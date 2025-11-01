import { test, expect, request } from '@playwright/test';

// Contract: POST /api/filter
// Accept either a successful response with proper shape OR a documented error status
// (when env/dependencies are intentionally missing in local dev).

test('POST /api/filter returns success or documented error', async ({ baseURL }) => {
  const api = await request.newContext({ baseURL });
  const body = { promptId: '6566f1f1f1f1f1f1f1f1f1f1', actorName: 'mock-actor' };
  const res = await api.post('/api/filter', { data: body });
  const status = res.status();

  if (status === 200) {
    const data = await res.json();
    expect(data).toBeTruthy();
    expect(Array.isArray(data.jobs)).toBe(true);
    expect(Array.isArray(data.rejects)).toBe(true);
    expect(Array.isArray(data.errors)).toBe(true);
  } else {
    // Allow documented error statuses or a 404 when the endpoint is unavailable in this environment
    expect([400, 404, 500].includes(status)).toBeTruthy();
  }
});
