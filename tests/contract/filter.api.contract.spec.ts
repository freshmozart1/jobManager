import { test, expect, request } from '@playwright/test';
import { ObjectId } from 'mongodb';
import { connectTestDb, disconnectTestDb, ensurePersonalInformation } from '../helpers';

test.setTimeout(5 * 60 * 1000);

test.skip(
    !process.env.MONGODB_CONNECTION_STRING
    || !process.env.APIFY_TOKEN
    || !process.env.OPENAI_API_KEY,
    'MongoDB, Apify, and OpenAI env vars required'
);

const PERSONAL_TYPES = [
    'contact',
    'eligibility',
    'constraints',
    'preferences',
    'experience',
    'education',
    'certifications',
    'languages_spoken',
    'exclusions',
    'motivations',
    'career_goals'
];

let dbContext: Awaited<ReturnType<typeof connectTestDb>>;
const createdPromptIds: ObjectId[] = [];
const createdScrapeUrlIds: ObjectId[] = [];

test.beforeAll(async () => {
    dbContext = await connectTestDb();
});

test.afterAll(async () => {
    await disconnectTestDb(dbContext);
});

test.afterEach(async () => {
    const { db } = dbContext;
    if (createdPromptIds.length) {
        await db.collection('jobs').deleteMany({ filteredBy: { $in: createdPromptIds } });
        await db.collection('prompts').deleteMany({ _id: { $in: createdPromptIds } });
        createdPromptIds.splice(0, createdPromptIds.length);
    }
    if (createdScrapeUrlIds.length) {
        await db.collection('scrapeUrls').deleteMany({ _id: { $in: createdScrapeUrlIds } });
        createdScrapeUrlIds.splice(0, createdScrapeUrlIds.length);
    }
    await db.collection('personalInformation').deleteMany({
        type: { $in: PERSONAL_TYPES }
    });
});

test('POST /api/filter returns jobs, rejects, and errors arrays', async ({ baseURL }) => {
    const { db } = dbContext;
    const promptInsert = await db.collection('prompts').insertOne({
        agentType: 'filter',
        name: 'Contract Test Prompt',
        createdAt: new Date(),
        updatedAt: new Date(),
        prompt: 'Use the tools to review jobs and the applicant profile. Return JSON: {"output": [true|false]} with one boolean per job in order.'
    });
    const promptId = promptInsert.insertedId;
    createdPromptIds.push(promptId);

    const scrapeInsert = await db.collection('scrapeUrls').insertOne({
        url: 'https://www.linkedin.com/jobs/search?keywords=Web%20Development&location=Hamburg&geoId=106430557&f_C=41629%2C11010661%2C162679%2C11146938%2C234280&distance=25&f_E=1%2C2&f_PP=106430557&f_TPR=r86400&position=1&pageNum=0'
    });
    createdScrapeUrlIds.push(scrapeInsert.insertedId);

    await ensurePersonalInformation(db);

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.post('/api/filter', {
            headers: {
                'x-test-db': db.databaseName
            },
            data: {
                promptId: promptId.toString(),
                actorName: process.env.APIFY_ACTOR_NAME || 'curious_coder/linkedin-jobs-scraper'
            }
        });

        const resText = await res.text();
        console.log('Response text:', resText);
        expect(res.status(), resText).toBe(200);
        const data = await res.json();

        expect(Array.isArray(data.jobs)).toBe(true);
        expect(Array.isArray(data.rejects)).toBe(true);
        expect(Array.isArray(data.errors)).toBe(true);

        const all = [...data.jobs, ...data.rejects, ...data.errors];
        for (const job of all) {
            expect(typeof job.id).toBe('string');
            expect(job.id.length).toBeGreaterThan(0);
            expect(typeof job.title).toBe('string');
            expect(typeof job.companyName).toBe('string');
            expect(typeof job.filteredAt).toBe('string');
            const filterResultType = typeof job.filterResult;
            expect(filterResultType === 'boolean' || (filterResultType === 'object' && typeof job.filterResult?.error === 'string')).toBe(true);
        }
    } finally {
        await api.dispose();
    }
});
