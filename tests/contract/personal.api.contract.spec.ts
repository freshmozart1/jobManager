import { test, expect, request } from '@playwright/test';
import { connectTestDb, disconnectTestDb, ensurePersonalInformation } from '../helpers';

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

test.skip(!process.env.MONGODB_CONNECTION_STRING, 'MongoDB connection env vars required');

let dbContext: Awaited<ReturnType<typeof connectTestDb>>;

test.beforeAll(async () => {
    dbContext = await connectTestDb();
});

test.afterAll(async () => {
    await disconnectTestDb(dbContext);
});

test.afterEach(async () => {
    await dbContext.db.collection('personalInformation').deleteMany({
        type: { $in: PERSONAL_TYPES }
    });
});

test('GET /api/personal returns full personal information payload', async ({ baseURL }) => {
    await ensurePersonalInformation(dbContext.db);
    const docs = await Promise.all(PERSONAL_TYPES.map(type => dbContext.db.collection('personalInformation').findOne({ type })));
    const api = await request.newContext({ baseURL });
    try {
        const res = await api.get('/api/personal', {
            headers: {
                'x-test-db': dbContext.db.databaseName
            }
        });
        expect(res.status(), await res.text()).toBe(200);
        const data = await res.json();
        for (let i = 0; i < PERSONAL_TYPES.length; i += 1) {
            if (PERSONAL_TYPES[i] === 'experience') {
                expect(data[PERSONAL_TYPES[i]]).toEqual(docs[i]?.value.map((exp: any) => ({
                    ...exp,
                    from: new Date(exp.from).toISOString(),
                    to: exp.to ? new Date(exp.to).toISOString() : null
                })));
                continue;
            }
            expect(data[PERSONAL_TYPES[i]]).toEqual(docs[i]?.value);
        }
    } finally {
        await api.dispose();
    }
});

test('PUT /api/personal upserts and returns updated document', async ({ baseURL }) => {
    const payload = {
        name: 'Jordan Blake',
        email: 'jordan.blake@example.com',
        phone: '+1-555-0199',
        address: {
            streetAddress: '500 Market St',
            addressLocality: 'San Francisco',
            addressRegion: 'CA',
            postalCode: '94105',
            addressCountry: 'US'
        },
        portfolio_urls: ['https://jordanblake.dev']
    };

    const api = await request.newContext({ baseURL });
    try {
        const res = await api.put('/api/personal', {
            headers: {
                'x-test-db': dbContext.db.databaseName
            },
            data: {
                type: 'contact',
                value: payload
            }
        });

        expect(res.status(), await res.text()).toBe(200);
        const data = await res.json();
        expect(data.type).toBe('contact');
        expect(data.value).toEqual(payload);

        const stored = await dbContext.db.collection('personalInformation').findOne({ type: 'contact' });
        expect(stored?.value).toEqual(payload);
    } finally {
        await api.dispose();
    }
});
