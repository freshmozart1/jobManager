import { test, expect, request } from '@playwright/test';
import { cleanupJobData, connectTestDb, createJobFixture, disconnectTestDb, seedJob } from './helpers';

test.skip(!process.env.MONGODB_CONNECTION_STRING || !process.env.DATABASE_NAME, 'MongoDB connection env vars required');

let dbContext: Awaited<ReturnType<typeof connectTestDb>>;

test.beforeAll(async () => {
    dbContext = await connectTestDb();
});

test.afterAll(async () => {
    await disconnectTestDb(dbContext);
});

test('POST /api/jobs/{id}/apply returns applied timestamp and is idempotent', async ({ baseURL }) => {
    const jobId = 'contract-job-apply';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const firstRes = await api.post(`/api/jobs/${jobId}/apply`, { data: {} });
        expect(firstRes.status(), await firstRes.text()).toBe(200);
        const firstBody = await firstRes.json();
        expect(typeof firstBody.appliedAt).toBe('string');

        const secondRes = await api.post(`/api/jobs/${jobId}/apply`, { data: {} });
        expect(secondRes.status(), await secondRes.text()).toBe(200);
        const secondBody = await secondRes.json();
        expect(secondBody.appliedAt).toBe(firstBody.appliedAt);

        const thirdTimestamp = new Date(Date.parse(firstBody.appliedAt) + 1000).toISOString();
        const conflictRes = await api.post(`/api/jobs/${jobId}/apply`, { data: { appliedAt: thirdTimestamp } });
        expect(conflictRes.status(), await conflictRes.text()).toBe(409);
        const conflictBody = await conflictRes.json();
        expect(conflictBody.error.code).toBe('JobAlreadyAppliedError');
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});
