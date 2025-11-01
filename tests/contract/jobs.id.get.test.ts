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

test('GET /api/jobs/{id} returns 404 when job missing', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const res = await api.get(`/api/jobs/job-nope-404`);
    expect(res.status(), await res.text()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('JobNotFoundError');
    await api.dispose();
});

test('GET /api/jobs/{id} returns job detail when found', async ({ baseURL }) => {
    const jobId = 'contract-job-detail';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.get(`/api/jobs/${jobId}`);
        expect(res.status(), await res.text()).toBe(200);
        const data = await res.json();
        expect(data.id).toBe(jobId);
        expect(data.title).toBe(job.title);
        expect(data.filterResult).toBe(true);
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});
