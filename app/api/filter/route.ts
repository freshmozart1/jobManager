import { corsHeaders } from "@/lib/cors";
import { MissingPromptIdInRequestBodyError, NoActorQueryParameterError, NoApifyTokenError, NoDatabaseNameError, NoOpenAIKeyError, NoPersonalInformationCareerGoalsError, NoPersonalInformationCertificationsError, NoPersonalInformationConstraintsError, NoPersonalInformationContactError, NoPersonalInformationEducationError, NoPersonalInformationEligibilityError, NoPersonalInformationExclusionsError, NoPersonalInformationExperienceError, NoPersonalInformationLanguageSpokenError, NoPersonalInformationMotivationsError, NoPersonalInformationPreferencesError, NoPersonalInformationSkillsError, NoScrapeUrlsError, PromptNotFoundError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { sleep } from "@/lib/utils";
import { Agent, Runner } from "@openai/agents";
import { ApifyClient } from "apify-client";
import { Db, ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

async function fetchPersonalInformation(db: Db) {
    const personalInformationCollection = db.collection<PersonalInformation>("personalInformation");
    const fetch = async <T>(type: string, msg: string) => {
        const doc = await personalInformationCollection.findOne<{ type: string; value: T }>({ type });
        if (!doc) throw { status: 400, statusText: msg };
        return doc.value;
    };
    return Promise.all([
        fetch<PersonalInformationContact>('contact', NoPersonalInformationContactError.name),
        fetch<PersonalInformationEligibility>('eligibility', NoPersonalInformationEligibilityError.name),
        fetch<PersonalInformationConstraints>('constraints', NoPersonalInformationConstraintsError.name),
        fetch<PersonalInformationPreferences>('preferences', NoPersonalInformationPreferencesError.name),
        fetch<PersonalInformationSkill[]>('skills', NoPersonalInformationSkillsError.name),
        fetch<PersonalInformationExperience>('experience', NoPersonalInformationExperienceError.name),
        fetch<PersonalInformationEducation[]>('education', NoPersonalInformationEducationError.name),
        fetch<PersonalInformationCertification[]>('certifications', NoPersonalInformationCertificationsError.name),
        fetch<PersonalInformationLanguageSpoken[]>('languages_spoken', NoPersonalInformationLanguageSpokenError.name),
        fetch<PersonalInformationExclusions>('exclusions', NoPersonalInformationExclusionsError.name),
        fetch<PersonalInformationMotivation[]>('motivations', NoPersonalInformationMotivationsError.name),
        fetch<PersonalInformationCareerGoal[]>('career_goals', NoPersonalInformationCareerGoalsError.name)
    ]);
}

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
    const runner = new Runner({ workflowName: 'jobManager - filter jobs' });
    const { APIFY_TOKEN, DATABASE_NAME, OPENAI_API_KEY } = process.env;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    if (!OPENAI_API_KEY) return NextResponse.json({}, { status: 500, statusText: NoOpenAIKeyError.name });
    const { promptId: promptIdRaw, actorName } = await req.json() as { promptId?: string; actorName?: string; };
    const promptId = promptIdRaw && ObjectId.isValid(promptIdRaw) ? new ObjectId(promptIdRaw) : undefined;
    if (!promptId) return NextResponse.json({}, { status: 400, statusText: MissingPromptIdInRequestBodyError.name });
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    if (!actorName) return NextResponse.json({}, { status: 400, statusText: NoActorQueryParameterError.name });
    if (!APIFY_TOKEN) return NextResponse.json({}, { status: 500, statusText: NoApifyTokenError.name });
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const urls = await db.collection<ScrapeUrlDocument>("scrapeUrls").find().toArray().then(d => d.map(x => x.url));
    if (!urls.length) return NextResponse.json({}, { status: 500, statusText: NoScrapeUrlsError.name });
    const apify = new ApifyClient({ token: APIFY_TOKEN });
    const lastRun = await apify.actor(actorName).runs().list({ limit: 1, desc: true }).then(r => r.items[0]);
    let scrapedJobs;
    if (lastRun && lastRun.startedAt.toDateString() === new Date().toDateString()) {
        scrapedJobs = (await apify.dataset<Job>(lastRun.defaultDatasetId!).listItems()).items;
    } else {
        scrapedJobs = (await apify.actor(actorName).call({ urls, count: 100 }).then(run =>
            apify.dataset<Job>(run.defaultDatasetId!).listItems()
        )).items;
    }
    const existingJobIdsSet = new Set(
        (await db.collection<{ id: string }>("jobs")
            .find({ 'filterResult.error': { $exists: false } }, { projection: { 'id': 1 } })
            .toArray()).map(d => d.id)
    );

    const jobIdsWithFilterErrorsSet = new Set(
        (await db.collection<{ id: string; filterResult: { error: string } }>("jobs")
            .find({ 'filterResult.error': { $exists: true } }, { projection: { 'id': 1 } })
            .toArray()).map(d => d.id)
    );

    scrapedJobs = scrapedJobs.filter(j => !existingJobIdsSet.has(j.id));
    const jobs: Job[] = [], rejects: Job[] = [], errors: Job[] = [];
    if (!scrapedJobs.length) return NextResponse.json({ jobs, rejects, errors }, { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) });
    const promptDoc = await db.collection<PromptDocument>('prompts').findOne({ _id: promptId });
    if (!promptDoc) return NextResponse.json({}, { status: 404, statusText: PromptNotFoundError.name });
    let personalInformation: PersonalInformation;
    try {
        personalInformation = Object.fromEntries(
            (await fetchPersonalInformation(db)).map((value, index) => [(
                [
                    'contact',
                    'eligibility',
                    'constraints',
                    'preferences',
                    'skills',
                    'experience',
                    'education',
                    'certifications',
                    'languages_spoken',
                    'exclusions',
                    'motivations',
                    'career_goals'
                ][index]
            ), value])
        ) as PersonalInformation;
    } catch (e: unknown) {
        const status = (typeof e === 'object' && e !== null && 'status' in e && typeof (e as { status?: unknown }).status === 'number')
            ? (e as { status: number }).status
            : 500;
        const statusText = (typeof e === 'object' && e !== null && 'statusText' in e && typeof (e as { statusText?: unknown }).statusText === 'string')
            ? (e as { statusText: string }).statusText
            : 'Error fetching personal information';
        return NextResponse.json({}, { status, statusText, headers: corsHeaders(req.headers.get('origin') || undefined) });
    }
    (await Promise.allSettled(scrapedJobs.map((job, jobIndex) => safeCall<Job>(`Filter job #${job.id} (${jobIndex + 1}/${scrapedJobs.length})`, async () => {
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
                instructions: promptDoc.prompt.replaceAll('{{JOB}}', JSON.stringify(job, null, 2)).replaceAll('{{PERSONAL_INFO}}', JSON.stringify(personalInformation, null, 2))
            }),
            'Decide if the job vacancy is suitable for application.'
        )).finalOutput;
        if (result === 'true') {
            job.filterResult = true;
            return job;
        }
        if (result === 'false') {
            job.filterResult = false;
            return job;
        }
        throw new Error(`Unexpected agent result: ${result}`);
    })))).forEach((r, i) => {
        if (r.status === 'fulfilled') {
            if (r.value.filterResult === true) {
                jobs.push(r.value);
            } else {
                rejects.push(r.value);
            }
        } else {
            const job = scrapedJobs[i];
            const errorMessage = r.reason instanceof Error ? r.reason.message : String(r.reason);
            job.filterResult = { error: errorMessage };
            errors.push(job);
        }
    });
    const allJobs = [...jobs, ...rejects, ...errors];
    await Promise.all(allJobs.map(job => {
        const jobToInsert = { ...job };
        if (jobIdsWithFilterErrorsSet.has(job.id)) {
            return db.collection<Job>('jobs').updateOne(
                { id: job.id },
                { $set: jobToInsert }
            );
        } else {
            return db.collection<Job>('jobs').insertOne(jobToInsert);
        }
    }))
    return NextResponse.json({ jobs, rejects, errors }, { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) });
}