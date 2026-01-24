import { MongoClient, Db } from 'mongodb';
import type { PersonalInformation } from '@/types';

export type TestDbContext = {
    client: MongoClient;
    db: Db;
};

export async function connectTestDb(): Promise<TestDbContext> {
    const uri = process.env.MONGODB_CONNECTION_STRING;
    const dbName = process.env.DATABASE_NAME;
    if (!uri || !dbName) throw new Error('MongoDB connection details are required for contract tests');
    const client = await new MongoClient(uri).connect();
    return { client, db: client.db(dbName) };
}

export async function disconnectTestDb(context: TestDbContext) {
    await context.client.close();
}


const PERSONAL_INFORMATION_FIXTURE: Omit<PersonalInformation, 'skills'> = {
    contact: {
        name: 'Alex Morgan',
        email: 'alex.morgan@example.com',
        phone: '+1-555-0123',
        address: {
            streetAddress: '123 Main St',
            addressLocality: 'San Francisco',
            addressRegion: 'CA',
            postalCode: '94102',
            addressCountry: 'US'
        },
        portfolio_urls: ['https://alexmorgan.dev']
    },
    eligibility: {
        work_authorization: [{ region: 'United States', status: 'Citizen' }],
        security_clearance: null,
        relocation: { willing: true, regions: ['Remote'] },
        remote: { willing: true, time_zone: 'UTC-5' },
        availability: { notice_period_days: 14 },
        work_schedule_constraints: { weekends: false, nights: false }
    },
    constraints: {
        salary_min: { currency: 'USD', amount: 100000 },
        locations_allowed: ['Remote']
    },
    preferences: {
        roles: ['Senior Software Engineer'],
        seniority: ['Senior'],
        company_size: ['Scale-up (50-500)'],
        work_mode: [{ mode: 'Remote' }],
        industries: ['Software']
    },
    experience: [
        {
            from: new Date('2020-01-01'),
            to: new Date('2024-10-01'),
            role: 'Senior Software Engineer',
            company: 'Tech Corp',
            summary: 'Led development of scalable web applications. Improved API reliability by 30% through contract testing.',
            tags: ['TypeScript', 'React', 'Node.js', 'API Design']
        }
    ],
    education: [
        {
            degree: 'BSc Computer Science',
            field: 'Computer Science',
            institution: 'State University',
            graduation_year: 2016
        }
    ],
    certifications: [
        {
            name: 'AWS Certified Developer',
            issued: '2023-01-01T00:00:00.000Z' as unknown as Date,
            expires: '2026-01-01T00:00:00.000Z' as unknown as Date
        },
        {
            name: 'Legacy Cert (YYYY-MM)',
            issued: '2022-06' as unknown as Date,
            expires: null
        }
    ],
    languages_spoken: [
        { language: 'English', level: 'Native' }
    ],
    exclusions: {
        avoid_roles: ['Sales Engineer'],
        avoid_technologies: ['PHP'],
        avoid_industries: ['Gambling'],
        avoid_companies: []
    },
    motivations: [
        {
            topic: 'Impact',
            description: 'Deliver resilient systems that users trust.',
            reason_lite: 'Build reliable products'
        }
    ],
    career_goals: [
        {
            topic: 'Technical Leadership',
            description: 'Lead teams shipping reliable platform features.',
            reason_lite: 'Grow as a leader'
        }
    ]
};

export async function ensurePersonalInformation(db: Db) {
    await Promise.all(
        Object.entries(PERSONAL_INFORMATION_FIXTURE).map(([type, value]) =>
            db.collection('personalInformation').updateOne(
                { type },
                { $set: { value } },
                { upsert: true }
            )
        )
    );
}