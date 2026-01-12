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

test('PUT /api/jobs/{id}/artifacts accepts minimal CV draft with only templateId', async ({ baseURL }) => {
    const jobId = 'contract-job-cv-minimal';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.put(`/api/jobs/${jobId}/artifacts`, {
            data: {
                type: 'cv',
                content: {
                    templateId: 'modern'
                }
            }
        });

        expect(res.status(), await res.text()).toBe(200);
        const data = await res.json();
        expect(data.artifact).toBeDefined();
        expect(data.artifact.type).toBe('cv');
        expect(data.artifact.content.templateId).toBe('modern');

        // Verify artifact stored in database
        const jobDoc = await dbContext.db.collection('jobs').findOne(
            { id: jobId },
            { projection: { artifacts: 1, _id: 0 } }
        );
        const cvArtifact = jobDoc?.artifacts?.find((a: any) => a.type === 'cv');
        expect(cvArtifact).toBeDefined();
        expect(cvArtifact?.content.templateId).toBe('modern');
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});

test('PUT /api/jobs/{id}/artifacts accepts CV draft with blank strings (treated as absent)', async ({ baseURL }) => {
    const jobId = 'contract-job-cv-blanks';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.put(`/api/jobs/${jobId}/artifacts`, {
            data: {
                type: 'cv',
                content: {
                    templateId: 'modern',
                    header: {
                        name: '',
                        email: '',
                        phone: '',
                        address: {
                            streetAddress: '',
                            addressLocality: '',
                            addressRegion: '',
                            postalCode: '',
                            addressCountry: ''
                        }
                    },
                    slots: {
                        education: [],
                        experience: [],
                        skills: []
                    }
                }
            }
        });

        expect(res.status(), await res.text()).toBe(200);
        const data = await res.json();
        expect(data.artifact).toBeDefined();
        expect(data.artifact.type).toBe('cv');
        expect(data.artifact.content.templateId).toBe('modern');

        // Verify blank strings are accepted (treated as absent)
        const jobDoc = await dbContext.db.collection('jobs').findOne(
            { id: jobId },
            { projection: { artifacts: 1, _id: 0 } }
        );
        const cvArtifact = jobDoc?.artifacts?.find((a: any) => a.type === 'cv');
        expect(cvArtifact).toBeDefined();
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});

test('PUT /api/jobs/{id}/artifacts accepts partial CV with some fields filled', async ({ baseURL }) => {
    const jobId = 'contract-job-cv-partial';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.put(`/api/jobs/${jobId}/artifacts`, {
            data: {
                type: 'cv',
                content: {
                    templateId: 'classic',
                    header: {
                        name: 'Jane Doe',
                        email: 'jane@example.com'
                        // phone and address omitted
                    },
                    slots: {
                        skills: [
                            {
                                id: 'skill-1',
                                name: 'TypeScript',
                                category: 'Programming',
                                level: 'expert',
                                years: 5
                            }
                        ]
                        // education and experience omitted
                    }
                }
            }
        });

        expect(res.status(), await res.text()).toBe(200);
        const data = await res.json();
        expect(data.artifact).toBeDefined();
        expect(data.artifact.type).toBe('cv');
        expect(data.artifact.content.templateId).toBe('classic');
        expect(data.artifact.content.header.name).toBe('Jane Doe');
        expect(data.artifact.content.header.email).toBe('jane@example.com');
        expect(data.artifact.content.slots.skills).toHaveLength(1);

        // Verify stored correctly
        const jobDoc = await dbContext.db.collection('jobs').findOne(
            { id: jobId },
            { projection: { artifacts: 1, _id: 0 } }
        );
        const cvArtifact = jobDoc?.artifacts?.find((a: any) => a.type === 'cv');
        expect(cvArtifact).toBeDefined();
        expect(cvArtifact?.content.header.name).toBe('Jane Doe');
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});

test('PUT /api/jobs/{id}/artifacts rejects CV with invalid experience date format', async ({ baseURL }) => {
    const jobId = 'contract-job-cv-invalid-date';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.put(`/api/jobs/${jobId}/artifacts`, {
            data: {
                type: 'cv',
                content: {
                    templateId: 'modern',
                    slots: {
                        experience: [
                            {
                                id: 'exp-1',
                                from: '2020-13', // Invalid month
                                role: 'Developer',
                                company: 'Acme Inc',
                                summary: 'Built things',
                                tags: ['typescript']
                            }
                        ]
                    }
                }
            }
        });

        expect(res.status()).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('InvalidCvContent');
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});

test('PUT /api/jobs/{id}/artifacts rejects CV without templateId', async ({ baseURL }) => {
    const jobId = 'contract-job-cv-no-template';
    const job = createJobFixture(jobId);
    await seedJob(dbContext.db, job);

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.put(`/api/jobs/${jobId}/artifacts`, {
            data: {
                type: 'cv',
                content: {
                    header: {
                        name: 'John Doe'
                    }
                }
            }
        });

        expect(res.status()).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('InvalidCvContent');
    } finally {
        await api.dispose();
        await cleanupJobData(dbContext.db, jobId);
    }
});
