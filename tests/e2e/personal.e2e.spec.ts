import { test } from '@playwright/test';
import { connectTestDb, disconnectTestDb } from '../helpers';

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


const personalInformationArray = [
    {
        type: 'contact',
        value: {
            name: 'Test Name',
            email: 'test@example.com',
            phone: '+1-555-0000',
            portfolio_urls: [],
            address: {
                streetAddress: '1 Test St',
                addressLocality: 'Testville',
                addressRegion: 'Test State',
                postalCode: '00000',
                addressCountry: 'Testland'
            }
        }
    },
    {
        type: 'eligibility',
        value: {
            work_authorization: [{ region: 'US', status: 'citizen' }],
            security_clearance: null,
            relocation: { willing: true, regions: ['US'] },
            remote: { willing: true, time_zone: 'PST' },
            availability: { notice_period_days: 14 },
            work_schedule_constraints: { weekends: false, nights: false }
        }
    },
    {
        type: 'constraints',
        value: {
            salary_min: { currency: 'USD', amount: 80000 },
            locations_allowed: ['San Francisco']
        }
    },
    {
        type: 'preferences',
        value: {
            roles: ['Software Engineer'],
            seniority: ['Mid'],
            company_size: ['100-500'],
            work_mode: [{ mode: 'Remote' }],
            industries: ['Technology']
        }
    },
    {
        type: 'experience',
        value: [
            {
                from: new Date('2020-01-01'),
                to: new Date('2022-01-01'),
                role: 'Developer',
                company: 'Test Co',
                summary: 'Built test features',
                tags: ['typescript', 'testing']
            }
        ]
    },
    {
        type: 'education',
        value: [
            {
                degree: 'BSc',
                field: 'Computer Science',
                institution: 'Test University',
                graduation_year: 2018
            }
        ]
    },
    {
        type: 'certifications',
        value: [
            {
                name: 'Test Cert',
                issued: new Date('2019-01-01'),
                expires: null
            }
        ]
    },
    {
        type: 'languages_spoken',
        value: [
            {
                language: 'English',
                level: 'Native'
            }
        ]
    },
    {
        type: 'exclusions',
        value: {
            avoid_roles: ['Sales'],
            avoid_technologies: ['PHP'],
            avoid_industries: ['Gambling'],
            avoid_companies: ['Test Corp']
        }
    },
    {
        type: 'motivations',
        value: [
            {
                topic: 'Impact',
                description: 'Make a difference',
                reason_lite: 'Meaningful work'
            }
        ]
    },
    {
        type: 'career_goals',
        value: [
            {
                topic: 'Leadership',
                description: 'Lead a team',
                reason_lite: 'Growth'
            }
        ]
    }
];

let dbContext: Awaited<ReturnType<typeof connectTestDb>>;
let dbName = '';

test.beforeAll(async ({ }, testInfo) => {
    dbName = `jobmanager_e2e_tests_${testInfo.project.name}`;
    process.env.DATABASE_NAME = dbName;
    dbContext = await connectTestDb();
});

test.afterAll(async () => {
    await dbContext.client.db(dbName).dropDatabase();
    await disconnectTestDb(dbContext);
});

test.beforeEach(async () => {
    await dbContext.db.collection('personalInformation').insertMany(personalInformationArray);
});

test.afterEach(async () => {
    await dbContext.db.collection('personalInformation').deleteMany({
        type: { $in: PERSONAL_TYPES }
    });
});


test('Personal Information E2E Flow', async ({ page, baseURL }) => {
    // Navigate to the personal information page
    await page.goto(`${baseURL}/personal`);
    await page.getByLabel('Name').fill('Alex Morgan');
    await page.getByLabel('Email').fill('alex.morgan@example.com');
    await page.getByLabel('Phone').fill('+1-555-0123');
    await page.getByLabel('Street Address').fill('123 Main St');
    await page.getByLabel('City').fill('San Francisco');
    await page.getByLabel('Region/State').fill('California');
    await page.getByLabel('Postal Code').fill('94102');
    await page.getByLabel('Country').click();
    await page.getByPlaceholder('Select a country').fill('United States');
    await page.getByTestId('combobox-option-united-states').click();
    await page.getByLabel('Portfolio URLs').fill('https://alexmorgan.dev,');
    const putPromise = page.waitForRequest(r => r.method() === 'PUT' && r.url().includes('/api/personal'));
    await page.getByTestId('saveContact').click();
    const putRequest = await putPromise;
    test.expect(putRequest).not.toBeNull();
    const putData = JSON.parse(putRequest.postData() || '{}');
    test.expect(putData).toEqual({
        type: 'contact',
        value: {
            name: 'Alex Morgan',
            email: 'alex.morgan@example.com',
            phone: '+1-555-0123',
            address: {
                streetAddress: '123 Main St',
                addressLocality: 'San Francisco',
                addressRegion: 'California',
                postalCode: '94102',
                addressCountry: 'United States'
            },
            portfolio_urls: ['https://alexmorgan.dev']
        }
    });
    const response = await putRequest.response();
    test.expect(response).not.toBeNull();
    test.expect(response?.status()).toBe(200);
    const responseData = await response?.json();
    test.expect(responseData).toEqual(putData);

    // Verify that the data was saved correctly in the database
    const contactInfo = await dbContext.db.collection('personalInformation').findOne({ type: 'contact' });
    test.expect(contactInfo).not.toBeNull();
    test.expect(contactInfo?.value.name).toBe('Alex Morgan');
    test.expect(contactInfo?.value.email).toBe('alex.morgan@example.com');
    test.expect(contactInfo?.value.phone).toBe('+1-555-0123');
    test.expect(contactInfo?.value.address.streetAddress).toBe('123 Main St');
    test.expect(contactInfo?.value.address.addressLocality).toBe('San Francisco');
    test.expect(contactInfo?.value.address.addressRegion).toBe('California');
    test.expect(contactInfo?.value.address.postalCode).toBe('94102');
    test.expect(contactInfo?.value.address.addressCountry).toBe('United States');
    test.expect(contactInfo?.value.portfolio_urls).toEqual(['https://alexmorgan.dev']);
});