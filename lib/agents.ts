'use server'
import OpenAI from "openai";
import { Agent, Runner, setTracingExportApiKey } from '@openai/agents';
import { sleep } from "./sleep";
import { NoApifyTokenError, NoDatabaseNameError, NoMongoDBConnectionStringError, NoOpenAIKeyError, NoScrapeUrlsError, ParsingAfterScrapeError } from "./errors";
import { Db, MongoClient } from "mongodb";
import { ApifyClient } from "apify-client";
import { ZJob } from "./zodSchemas";
import z from "zod";

function extractSuggestedDelayMs(err: unknown): number | null {
    if (err && typeof err === 'object') {
        const errorObj = err as {
            response?: { headers?: Record<string, string | number | undefined> };
            message?: unknown;
        };
        const headers = errorObj.response?.headers;
        if (headers) {
            console.log('Error headers:', headers);
            const retryAfterValue = headers['retry-after'] ?? headers['Retry-After'];
            if (retryAfterValue !== undefined) {
                const asNumber = typeof retryAfterValue === 'number' ? retryAfterValue : Number(retryAfterValue);
                if (!Number.isNaN(asNumber)) {
                    return asNumber * 1000; //if header.retry-after is in seconds, return milliseconds
                } else if (typeof retryAfterValue === 'string') {
                    const dateMs = Date.parse(retryAfterValue);
                    if (!Number.isNaN(dateMs)) {
                        const delta = dateMs - Date.now();
                        if (delta > 0) return delta; //if date is in the future, return milliseconds until that date
                    }
                }
            }
        }
        if (typeof errorObj.message === 'string') {
            const retrymatch = errorObj.message.match(/try again in (?:(\d{1,4})ms|(\d+)(?:\.(\d+))?s)/i);
            if (retrymatch) {
                const [, ms, s] = retrymatch;
                if (ms) return Number(ms);
                if (s) return Number(s) * 1000;
            }
        }
    }
    return null;
}

async function safeCall<T>(ctx: string, fn: () => Promise<T>, opts: AgentRunRetryOptions = {}): Promise<T> {
    const {
        retries = 5,
        baseDelayMs = 600,
        maxDelayMs = 8000,
        jitterRatio = 0.4,
        retryOn = ({ status }) => status === 429 || status === null || (status >= 500 && status < 600),
        onRequestTooLarge
    } = opts;
    for (let attempt = 0; ; attempt++) {
        try {
            return await fn();
        } catch (e) {
            let status: number | null = null, msg = '', type: string | undefined;
            if (e instanceof OpenAI.APIError) {
                status = e.status ?? null; type = e.type; msg = e.message;
                if (/request too large/i.test(msg)) {
                    if (onRequestTooLarge) {
                        console.warn(`[safeCall] ${ctx} request too large; invoking handler.`);
                        return onRequestTooLarge();
                    }
                    console.error(`[safeCall] ${ctx} request too large; no handler.`);
                    return Promise.reject(e);
                }
            } else if (e instanceof Error) { msg = e.message; type = typeof e; }
            else { msg = String(e); type = typeof e; }
            if (!(attempt < retries && retryOn({ status, error: e, attempt }))) {
                console.error(`[safeCall] ${ctx} failed (final):`, { status, type, msg });
                return Promise.reject(e);
            }
            let delay = extractSuggestedDelayMs(e), reason = 'server-suggested';
            if (delay == null) {
                reason = status === 429 ? 'rate-limit' : (status && status >= 500 ? 'server-error' : 'network/unknown');
                delay = Math.min(maxDelayMs, baseDelayMs * (2 ** attempt));
            }
            const jitter = delay * jitterRatio;
            delay += Math.max(0, Math.round(Math.random() * jitter * 2 - jitter));
            console.warn(`[safeCall] ${ctx} failed (attempt ${attempt + 1} of ${retries}, ${reason}), retrying in ${delay}ms:`, { status, type, msg });
            await sleep(delay);
        }
    }
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

async function fetchPrompt(db: Db, agentType: string): Promise<string> {
    const prompts = db.collection<PromptDocument>('prompts');
    const promptDoc = await prompts.findOne({ agentType }, { sort: { updatedAt: -1 } });
    if (!promptDoc) throw new Error(`No prompt found for agent type: ${agentType}`);
    return promptDoc.prompt;
}


export async function runFilterAgent(): FilterAgentPromise {
    const { MONGODB_CONNECTION_STRING, DATABASE_NAME, OPENAI_API_KEY } = process.env;
    if (!OPENAI_API_KEY) throw new NoOpenAIKeyError();
    if (!MONGODB_CONNECTION_STRING) throw new NoMongoDBConnectionStringError();
    if (!DATABASE_NAME) throw new NoDatabaseNameError();
    const mongo = new MongoClient(MONGODB_CONNECTION_STRING);
    const db = mongo.db(DATABASE_NAME);
    setTracingExportApiKey(OPENAI_API_KEY);
    const runner = new Runner({ workflowName: 'jobManager - filter jobs' });
    try {
        await mongo.connect();
        await db.command({ ping: 1 }, { timeoutMS: 3000 });
        const [scrapedJobs, personalInformation, prompt] = await Promise.all([
            fetchJobs(db),
            fetchPersonalInformation(db),
            fetchPrompt(db, 'filter')
        ]);
        if (!scrapedJobs.length) return { jobs: [], rejects: [], errors: [] };
        const filterResults = await Promise.allSettled(scrapedJobs.map((job, jobIndex) => safeCall<Job | null>(`Filter job #${job.id} (${jobIndex + 1}/${scrapedJobs.length})`, async () => {
            const result = (await runner.run(
                new Agent({
                    name: 'Job Filter Agent',
                    model: 'gpt-5-nano',
                    modelSettings: {
                        maxTokens: 16000,
                        reasoning: {
                            effort: 'high',
                            summary: "detailed"
                        }
                    },
                    instructions: prompt.replaceAll('{{JOB}}', JSON.stringify(job, null, 2)).replaceAll('{{PERSONAL_INFO}}', JSON.stringify(personalInformation, null, 2))
                }),
                'Decide if the job vacancy is suitable for application.'
            )).finalOutput;
            if (result === 'true') return job;
            if (result === 'false') return null;
            throw new Error(`Unexpected agent result: ${result}`);
        })));
        const jobs = filterResults
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<Job | null>).value)
            .filter((job): job is Job => job !== null);

        const rejects = filterResults
            .map((r, i) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<Job | null>).value === null ? scrapedJobs[i] : null)
            .filter((job): job is Job => job !== null);

        const errors = filterResults
            .filter(r => r.status === 'rejected')
            .map(r => (r as PromiseRejectedResult).reason);

        return { jobs, rejects, errors };
    } finally { await mongo.close(); }
}