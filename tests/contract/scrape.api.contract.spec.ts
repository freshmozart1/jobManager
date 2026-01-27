import { test, expect, request } from '@playwright/test';
import { ObjectId } from 'mongodb';
import { connectTestDb, disconnectTestDb } from '../helpers';

test.setTimeout(5 * 60 * 1000);

test.skip(
    !process.env.MONGODB_CONNECTION_STRING
    || !process.env.APIFY_TOKEN,
    'MongoDB and Apify env vars required'
);

let dbContext: Awaited<ReturnType<typeof connectTestDb>>;
const createdScrapeUrlIds: ObjectId[] = [];

test.beforeAll(async () => {
    dbContext = await connectTestDb();
});

test.afterAll(async () => {
    await disconnectTestDb(dbContext);
});

test.afterEach(async () => {
    const { db } = dbContext;
    if (createdScrapeUrlIds.length) {
        await db.collection('scrapeUrls').deleteMany({ _id: { $in: createdScrapeUrlIds } });
        createdScrapeUrlIds.splice(0, createdScrapeUrlIds.length);
    }
});

test('GET /api/jobs/scrape returns scraped job array', async ({ baseURL }) => {
    const { db } = dbContext;
    const scrapeInsert = await db.collection('scrapeUrls').insertOne({
        url: 'https://www.linkedin.com/jobs/search?keywords=Web%20Development&location=Hamburg&geoId=106430557&f_C=41629%2C11010661%2C162679%2C11146938%2C234280&distance=25&f_E=1%2C2&f_PP=106430557&f_TPR=r86400&position=1&pageNum=0'
    });
    createdScrapeUrlIds.push(scrapeInsert.insertedId);

    const actorName = process.env.APIFY_ACTOR_NAME || 'curious_coder/linkedin-jobs-scraper';
    const api = await request.newContext({ baseURL });
    try {
        const res = await api.get(`/api/jobs/scrape?actorName=${encodeURIComponent(actorName)}&count=1`, {
            headers: {
                'x-test-db': db.databaseName
            }
        });
        const resText = await res.text();
        expect(res.status(), resText).toBe(200);
        const data = JSON.parse(resText);

        expect(Array.isArray(data)).toBe(true);
        for (const job of data) {
            expect(typeof job.id).toBe('string');
            expect(job.id.length).toBeGreaterThan(0);
            expect(typeof job.title).toBe('string');
            expect(typeof job.companyName).toBe('string');
            expect(typeof job.link).toBe('string');
            expect(typeof job.inputUrl).toBe('string');
            expect(typeof job.descriptionText).toBe('string');
            expect(typeof job.employmentType).toBe('string');
            if (job.postedAt !== undefined) {
                expect(typeof job.postedAt === 'string' || job.postedAt === null).toBe(true);
            }
            if (job.applicantsCount !== undefined) {
                expect(typeof job.applicantsCount === 'string' || typeof job.applicantsCount === 'number').toBe(true);
            }
        }
    } finally {
        await api.dispose();
    }
});
