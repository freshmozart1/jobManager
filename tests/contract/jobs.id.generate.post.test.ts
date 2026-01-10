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
        expect(data.artifacts.length).toBe(2);

        // Verify artifacts stored in Job.artifacts[] array
        const jobDoc = await dbContext.db.collection('jobs').findOne(
            { id: jobId },
            { projection: { artifacts: 1, _id: 0 } }
        );
        expect(jobDoc?.artifacts).toHaveLength(2);

        // Verify cover letter artifact is string
        const coverLetterArtifact = jobDoc?.artifacts.find((a: any) => a.type === 'cover-letter');
        expect(coverLetterArtifact).toBeDefined();
        expect(typeof coverLetterArtifact?.content).toBe('string');
        expect(coverLetterArtifact?.content.length).toBeGreaterThan(0);

        // Verify CV artifact is CvModel JSON with YYYY-MM dates
        const cvArtifact = jobDoc?.artifacts.find((a: any) => a.type === 'cv');
        expect(cvArtifact).toBeDefined();
        expect(typeof cvArtifact?.content).toBe('object');
        expect(cvArtifact?.content.templateId).toBeDefined();
        expect(cvArtifact?.content.header).toBeDefined();
        expect(cvArtifact?.content.slots).toBeDefined();

        // Validate experience dates are YYYY-MM strings (regression assertion)
        const experience = cvArtifact?.content.slots.experience;
        if (experience && experience.length > 0) {
            const firstExp = experience[0];
            expect(typeof firstExp.from).toBe('string');
            expect(firstExp.from).toMatch(/^\d{4}-\d{2}$/);
            if (firstExp.to) {
                expect(typeof firstExp.to).toBe('string');
                expect(firstExp.to).toMatch(/^\d{4}-\d{2}$/);
            }
        }
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});
