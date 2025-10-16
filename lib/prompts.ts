'use server'
import { NoMongoDBConnectionStringError, NoDatabaseNameError, NoApifyTokenError, NoScrapeUrlsError, ParsingAfterScrapeError } from "@/lib/errors";
import z from "@/node_modules/zod/v4/classic/external.cjs";
import { ApifyClient } from "apify-client";
import { Db, MongoClient } from "mongodb";
import { ZJob } from "./zodSchemas";

async function fetchPersonalInformation(db: Db) {
    const personalInformationCollection = db.collection<PersonalInformation>("personalInformation");
    const fetch = async <T>(type: string, msg: string) => {
        const doc = await personalInformationCollection.findOne<{ type: string; value: T }>({ type });
        if (!doc) throw new Error(msg);
        return doc.value;
    };
    const [contact, eligibility, constraints, preferences, skills, experience, education, certifications, languages_spoken, exclusions, motivations, career_goals] = await Promise.all([
        fetch<PersonalInformationContact>('contact', 'No contact information found in personalInformation collection'),
        fetch<PersonalInformationEligibility>('eligibility', 'No eligibility information found in personalInformation collection'),
        fetch<PersonalInformationConstraints>('constraints', 'No constraints information found in personalInformation collection'),
        fetch<PersonalInformationPreferences>('preferences', 'No preferences information found in personalInformation collection'),
        fetch<PersonalInformationSkill[]>('skills', 'No skills information found in personalInformation collection'),
        fetch<PersonalInformationExperience>('experience', 'No experience information found in personalInformation collection'),
        fetch<PersonalInformationEducation[]>('education', 'No education information found in personalInformation collection'),
        fetch<PersonalInformationCertification[]>('certifications', 'No certifications information found in personalInformation collection'),
        fetch<PersonalInformationLanguageSpoken[]>('languages_spoken', 'No languages spoken information found in personalInformation collection'),
        fetch<PersonalInformationExclusions>('exclusions', 'No exclusions information found in personalInformation collection'),
        fetch<PersonalInformationMotivation[]>('motivations', 'No motivations information found in personalInformation collection'),
        fetch<PersonalInformationCareerGoal[]>('career_goals', 'No career goals information found in personalInformation collection')
    ]);
    return { contact, eligibility, constraints, preferences, skills, experience, education, certifications, languages_spoken, exclusions, motivations, career_goals };
}

async function fetchJobs(db: Db): Promise<Job[]> {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    if (!APIFY_TOKEN) throw new NoApifyTokenError();
    const apify = new ApifyClient({ token: APIFY_TOKEN });
    const scrapeIds = db.collection<ScrapeIdDocument>("scrapeIds");
    const scrapeUrls = db.collection<ScrapeUrlDocument>("scrapeUrls");
    const latestScrapeIdDocument = await scrapeIds.find().sort("cTimeMs", -1).limit(1).next();
    const jobsParseResult = await z.array(ZJob).safeParseAsync(latestScrapeIdDocument && Date.now() - Number(latestScrapeIdDocument.cTimeMs) < 864e5
        ? await apify.dataset(latestScrapeIdDocument.scrapeId).listItems().then(r => r.items)
        : await (async () => {
            const urls = await scrapeUrls.find().toArray().then(d => d.map(x => x.url));
            if (!urls.length) throw new NoScrapeUrlsError();
            const { defaultDatasetId } = await apify.actor("curious_coder/linkedin-jobs-scraper").call({ urls, count: 100 });
            await scrapeIds.insertOne({ scrapeId: defaultDatasetId, cTimeMs: BigInt(Date.now()) });
            return apify.dataset(defaultDatasetId).listItems().then(r => r.items);
        })());
    if (!jobsParseResult.success) throw new ParsingAfterScrapeError(jobsParseResult.error);
    return jobsParseResult.data;
}

async function fetchPrompt(db: Db, agentType: string): Promise<string> {
    const prompts = db.collection<PromptDocument>('prompts');
    const promptDoc = await prompts.findOne({ agentType }, { sort: { updatedAt: -1 } });
    if (!promptDoc) throw new Error(`No prompt found for agent type: ${agentType}`);
    return promptDoc.prompt;
}

export async function getFilterInstructions(): Promise<string[]> {
    const { MONGODB_CONNECTION_STRING, DATABASE_NAME } = process.env;
    if (!MONGODB_CONNECTION_STRING) throw new NoMongoDBConnectionStringError();
    if (!DATABASE_NAME) throw new NoDatabaseNameError();
    const mongo = new MongoClient(MONGODB_CONNECTION_STRING);
    const db = mongo.db(DATABASE_NAME);
    try {
        await mongo.connect();
        await db.command({ ping: 1 }, { timeoutMS: 3000 });
        const [jobs, personalInformation, prompt] = await Promise.all([
            fetchJobs(db),
            fetchPersonalInformation(db),
            fetchPrompt(db, 'filter')
        ]);
        if (!prompt) throw new Error('No prompt found for agent type: filter');
        return jobs.map(job => prompt.replaceAll('{{JOB}}', JSON.stringify(job, null, 2)).replaceAll('{{PERSONAL_INFO}}', JSON.stringify(personalInformation, null, 2)));
    } finally { await mongo.close(); }
}