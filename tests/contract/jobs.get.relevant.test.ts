import { test, expect, request } from '@playwright/test';

// Contract: GET /api/jobs?filter=relevant returns 200 and an array

test('GET /api/jobs?filter=relevant returns array', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const res = await api.get('/api/jobs?filter=relevant');
    expect(res.status(), await res.text()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
});
