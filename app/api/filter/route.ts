import { corsHeaders } from "@/lib/cors";
import { MissingPromptIdInRequestBodyError, NoActorQueryParameterError, NoApifyTokenError, NoDatabaseNameError, NoOpenAIKeyError, NoPersonalInformationCareerGoalsError, NoPersonalInformationCertificationsError, NoPersonalInformationConstraintsError, NoPersonalInformationContactError, NoPersonalInformationEducationError, NoPersonalInformationEligibilityError, NoPersonalInformationExclusionsError, NoPersonalInformationExperienceError, NoPersonalInformationLanguageSpokenError, NoPersonalInformationMotivationsError, NoPersonalInformationPreferencesError, NoPersonalInformationSkillsError, NoScrapeUrlsError, PromptNotFoundError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { chunkArray, sleep } from "@/lib/utils";
import { AgentRunRetryOptions, Job, PersonalInformation, PersonalInformationCareerGoal, PersonalInformationCertification, PersonalInformationConstraints, PersonalInformationContact, PersonalInformationEducation, PersonalInformationEligibility, PersonalInformationExclusions, PersonalInformationExperience, PersonalInformationLanguageSpoken, PersonalInformationMotivation, PersonalInformationPreferences, PersonalInformationSkill, PromptDocument, ScrapedJob, ScrapeUrlDocument } from "@/types";
import { Agent, Runner, tool } from "@openai/agents";
import { ApifyClient } from "apify-client";
import { Db, ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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
    const { promptId: rawPromptId, actorName } = await req.json() as { promptId?: string; actorName?: string; };
    if (!rawPromptId || !ObjectId.isValid(rawPromptId)) return NextResponse.json({}, { status: 400, statusText: MissingPromptIdInRequestBodyError.name });
    const promptId = new ObjectId(rawPromptId);
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    if (!actorName) return NextResponse.json({}, { status: 400, statusText: NoActorQueryParameterError.name });
    if (!APIFY_TOKEN) return NextResponse.json({}, { status: 500, statusText: NoApifyTokenError.name });
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const urls = await db.collection<ScrapeUrlDocument>("scrapeUrls").find().toArray().then(d => d.map(x => x.url));
    if (!urls.length) return NextResponse.json({}, { status: 500, statusText: NoScrapeUrlsError.name });

    // Fetch prompt (moved up so we can use updatedAt below)
    const promptDoc = await db.collection<PromptDocument>('prompts')
        .findOne({ _id: promptId }, { projection: { prompt: 1, updatedAt: 1 } });
    if (!promptDoc) return NextResponse.json({}, { status: 404, statusText: PromptNotFoundError.name });

    const apify = new ApifyClient({ token: APIFY_TOKEN });
    const lastRun = await apify.actor(actorName).runs().list({ limit: 1, desc: true }).then(r => r.items[0]);
    let scrapedJobs;
    if (lastRun && lastRun.startedAt.toDateString() === new Date().toDateString()) {
        scrapedJobs = (await apify.dataset<ScrapedJob>(lastRun.defaultDatasetId!).listItems()).items;
    } else {
        scrapedJobs = (await apify.actor(actorName).call({ urls, count: 100 }).then(run =>
            apify.dataset<ScrapedJob>(run.defaultDatasetId!).listItems()
        )).items;
    }

    const [jobsWithErrorsSet, outdatedJobsSet, notOutdatedJobsSet, filteredByDifferentPromptSet] = await Promise.all([
        db.collection<{ id: string }>("jobs")
            .find({ 'filterResult.error': { $exists: true } }, { projection: { id: 1 } })
            .map(d => d.id).toArray().then(ids => new Set(ids)),
        db.collection<{ id: string }>("jobs")
            .find({ filteredBy: promptId, filteredAt: { $lt: promptDoc.updatedAt } }, { projection: { id: 1 } })
            .map(d => d.id).toArray().then(ids => new Set(ids)),
        db.collection<{ id: string }>("jobs")
            .find({ filteredBy: promptId, filteredAt: { $gte: promptDoc.updatedAt } }, { projection: { id: 1 } })
            .map(d => d.id).toArray().then(ids => new Set(ids)),
        db.collection<{ id: string }>("jobs")
            .find({ filteredBy: { $ne: promptId } }, { projection: { id: 1 } })
            .map(d => d.id).toArray().then(ids => new Set(ids))
    ]);

    let outdatedCount = 0;
    const mustUpdate = (job: ScrapedJob | Job) => jobsWithErrorsSet.has(job.id) || outdatedJobsSet.has(job.id) || filteredByDifferentPromptSet.has(job.id);
    scrapedJobs = scrapedJobs.filter(job => {
        if (mustUpdate(job)) {
            outdatedCount++;
            return true;
        } else if (notOutdatedJobsSet.has(job.id)) {
            return false;
        } else return true;
    });

    console.log(`Total scraped jobs: ${scrapedJobs.length}, to be re-filtered: ${outdatedCount}`);

    const jobs: Job[] = [], rejects: Job[] = [], errors: Job[] = [];
    if (!scrapedJobs.length) return NextResponse.json({ jobs, rejects, errors }, { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) });
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
    const scrapedJobChunks = chunkArray(scrapedJobs, 5);
    (await Promise.allSettled(scrapedJobChunks.map((chunk, chunkIndex) => safeCall<Job[]>(`Filter chunk (${chunkIndex + 1}/${scrapedJobChunks.length})`, async () => {
        const agentOutput = z.object({ output: z.array(z.boolean()) });
        type AgentOutputType = z.infer<typeof agentOutput>;
        let jobIndex = 0;
        const nextJobTool = tool({
            name: 'next_job',
            description: 'Returns the next job from the array of jobs to be filtered. If there are no more jobs, returns null.',
            parameters: z.object({}),
            execute: () => {
                if (jobIndex < chunk.length) {
                    const job = chunk[jobIndex];
                    jobIndex++;
                    return job;
                } else jobIndex = 0;
                return null;
            }
        });
        const personalInformationTool = tool({
            name: 'get_profile',
            description: 'Returns the personal information profile of the job applicant, including contact details, eligibility, constraints, preferences, skills, experience, education, certifications, languages spoken, exclusions, motivations, and career goals.',
            parameters: z.object({}),
            execute: () => personalInformation
        });
        const result = (await runner.run(
            new Agent({
                name: `Job Filter Agent chunk ${chunkIndex + 1}`,
                model: 'gpt-5-nano',
                modelSettings: {
                    maxTokens: 16000,
                    reasoning: {
                        effort: 'high',
                        summary: "detailed"
                    }
                },
                tools: [nextJobTool, personalInformationTool],
                instructions: promptDoc.prompt,
                outputType: agentOutput
            }),
            'Decide if the job vacancy is suitable for application.'
        )).finalOutput as AgentOutputType | undefined;
        if (result && Array.isArray(result.output)) {
            if (result.output.length !== chunk.length) {
                throw new Error(`Agent output length ${result.output.length} does not match chunk length ${chunk.length}`);
            }
            const resultJobs: Job[] = [];
            for (let i = 0; i < result.output.length && i < chunk.length; i++) {
                const res = result.output[i];
                resultJobs.push({
                    ...chunk[i],
                    filteredAt: new Date(),
                    filterResult: typeof res === 'boolean'
                        ? res
                        : { error: `Unexpected output format from agent: ${JSON.stringify(res)}` },
                    filteredBy: promptId
                });
            }
            return resultJobs;
        }
        throw new Error(`Unexpected agent result: ${result}`);
    })))).forEach((r, i) => {
        if (r.status === 'fulfilled') {
            const filteredJobs = r.value;
            for (const job of filteredJobs) {
                if (typeof job.filterResult === 'boolean') {
                    if (job.filterResult === true) {
                        jobs.push(job);
                    } else {
                        rejects.push(job);
                    }
                } else {
                    errors.push(job);
                }
            }
        } else {
            console.error(`Error processing chunk ${i + 1}:`, r.reason);
            const failedChunk = scrapedJobChunks[i];
            for (const job of failedChunk) {
                errors.push({
                    ...job,
                    filteredAt: new Date(),
                    filterResult: { error: `Failed to process job due to chunk error: ${r.reason}` },
                    filteredBy: promptId
                });
            }
        }
    });
    console.log(`Filtered jobs: ${jobs.length} accepted, ${rejects.length} rejected, ${errors.length} errors.`);
    await Promise.all([...jobs, ...rejects, ...errors].map(job => {
        const jobToInsert = { ...job };
        if (mustUpdate(job)) {
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