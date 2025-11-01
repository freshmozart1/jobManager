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

test('POST /api/jobs/{id}/generate returns 202 with artifact pointers', async ({ baseURL }) => {
    const jobId = 'contract-job-generate';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.post(`/api/jobs/${jobId}/generate`, {
            data: { types: ['cover-letter', 'cv'] }
        });

        expect(res.status(), await res.text()).toBe(202);
        const data = await res.json();
        expect(typeof data.runId).toBe('string');
        expect(Array.isArray(data.artifacts)).toBe(true);
        expect(data.artifacts).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'cover-letter', url: `/api/jobs/${jobId}/download?type=cover-letter` }),
            expect.objectContaining({ type: 'cv', url: `/api/jobs/${jobId}/download?type=cv` })
        ]));

        const storedArtifacts = await dbContext.db.collection('jobArtifacts').find({ jobId }).toArray();
        expect(storedArtifacts).toHaveLength(2);
        storedArtifacts.forEach(artifact => {
            expect(artifact.runId).toBe(data.runId);
            expect(typeof artifact.content).toBe('string');
        });

        const jobDoc = await dbContext.db.collection('jobs').findOne({ id: jobId }, { projection: { generation: 1, _id: 0 } });
        expect(jobDoc?.generation?.runId).toBe(data.runId);
        expect(jobDoc?.generation?.types).toEqual(['cover-letter', 'cv']);
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});
