import { test, expect, request } from '@playwright/test';
import { cleanupJobData, connectTestDb, createJobFixture, disconnectTestDb, ensurePersonalInformation, seedJob } from './helpers';

test.skip(!process.env.MONGODB_CONNECTION_STRING || !process.env.DATABASE_NAME, 'MongoDB connection env vars required');

let dbContext: Awaited<ReturnType<typeof connectTestDb>>;

test.beforeAll(async () => {
    dbContext = await connectTestDb();
    await ensurePersonalInformation(dbContext.db);
});

test.afterAll(async () => {
    await disconnectTestDb(dbContext);
});

test('GET /api/jobs/{id}/download returns 200 with artifact stream', async ({ baseURL }) => {
    const jobId = 'contract-job-download';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const generateRes = await api.post(`/api/jobs/${jobId}/generate`, {
            data: { types: ['cover-letter'] }
        });
        expect(generateRes.status(), await generateRes.text()).toBe(202);

        const res = await api.get(`/api/jobs/${jobId}/download?type=cover-letter`);
        expect(res.status(), await res.text()).toBe(200);
        expect(res.headers()['content-type']).toContain('text/plain');
        expect(res.headers()['content-disposition']).toContain(`job-${jobId}-cover-letter`);
        const body = await res.text();
        expect(body).toContain(job.companyName);
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});
