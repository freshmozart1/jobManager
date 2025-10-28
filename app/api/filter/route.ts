import { corsHeaders } from "@/lib/cors";
import { MissingPromptIdInRequestBodyError, NoActorQueryParameterError, NoApifyTokenError, NoDatabaseNameError, NoOpenAIKeyError, NoScrapeUrlsError, PromptNotFoundError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { fetchPersonalInformation } from "@/lib/personal";
import { chunkArray, sleep } from "@/lib/utils";
import { AgentRunRetryOptions, Job, PersonalInformation, PromptDocument, ScrapedJob, ScrapeUrlDocument } from "@/types";
import { Agent, Runner, tool } from "@openai/agents";
import { ApifyClient } from "apify-client";
import { ObjectId } from "mongodb";
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

// Simplified retry helper (keeps behavior, trims logging & branching)
async function safeCall<T>(ctx: string, fn: () => Promise<T>, opts: AgentRunRetryOptions = {}): Promise<T> {
    const {
        retries = 5,
        baseDelayMs = 600,
        maxDelayMs = 8000,
        jitterRatio = 0.4,
        retryOn = ({ status }) => status === 429 || status === null || (status >= 500 && status < 600),
        onRequestTooLarge
    } = opts;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try { return await fn(); } catch (e) {
            let status: number | null = null, msg = '';
            if (e instanceof OpenAI.APIError) {
                status = e.status ?? null; msg = e.message;
                if (/request too large/i.test(msg)) return onRequestTooLarge ? onRequestTooLarge() : Promise.reject(e);
            } else if (e instanceof Error) msg = e.message;
            if (attempt === retries || !retryOn({ status, error: e, attempt })) return Promise.reject(e);
            let delay = extractSuggestedDelayMs(e) ?? Math.min(maxDelayMs, baseDelayMs * (2 ** attempt));
            const jitter = delay * jitterRatio;
            delay += Math.round((Math.random() * 2 - 1) * jitter);
            await sleep(Math.max(0, delay));
        }
    }
    throw new Error(`safeCall: exhausted retries for ${ctx}`);
}

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
    const runner = new Runner({ workflowName: 'jobManager - filter jobs' });
    const { APIFY_TOKEN, DATABASE_NAME, OPENAI_API_KEY } = process.env;
    const missingEnv = !DATABASE_NAME ? NoDatabaseNameError.name :
        !OPENAI_API_KEY ? NoOpenAIKeyError.name :
            !APIFY_TOKEN ? NoApifyTokenError.name : null;
    if (missingEnv) return NextResponse.json({}, { status: 500, statusText: missingEnv });
    const { promptId: rawPromptId, actorName } = await req.json() as { promptId?: string; actorName?: string; };
    if (!rawPromptId || !ObjectId.isValid(rawPromptId)) return NextResponse.json({}, { status: 400, statusText: MissingPromptIdInRequestBodyError.name });
    if (!actorName) return NextResponse.json({}, { status: 400, statusText: NoActorQueryParameterError.name });
    const promptId = new ObjectId(rawPromptId);
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const urls = await db.collection<ScrapeUrlDocument>("scrapeUrls").find().toArray().then(d => d.map(x => x.url));
    if (!urls.length) return NextResponse.json({}, { status: 500, statusText: NoScrapeUrlsError.name });
    const promptDoc = await db.collection<PromptDocument>('prompts')
        .findOne({ _id: promptId }, { projection: { prompt: 1, updatedAt: 1 } });
    if (!promptDoc) return NextResponse.json({}, { status: 404, statusText: PromptNotFoundError.name });
    const apify = new ApifyClient({ token: APIFY_TOKEN });
    const lastRun = await apify.actor(actorName).runs().list({ limit: 1, desc: true }).then(r => r.items[0]);
    let scrapedJobs = lastRun && lastRun.startedAt.toDateString() === new Date().toDateString()
        ? (await apify.dataset<ScrapedJob>(lastRun.defaultDatasetId!).listItems()).items
        : (await apify.actor(actorName).call({ urls, count: 100 }).then(run =>
            apify.dataset<ScrapedJob>(run.defaultDatasetId!).listItems()
        )).items;
    const [withErrors, outdated, notOutdated, differentPrompt] = await Promise.all(
        ([
            [{ 'filterResult.error': { $exists: true } }, 'withErrors'],
            [{ filteredBy: promptId, filteredAt: { $lt: promptDoc.updatedAt } }, 'outdated'],
            [{ filteredBy: promptId, filteredAt: { $gte: promptDoc.updatedAt } }, 'notOutdated'],
            [{ filteredBy: { $ne: promptId } }, 'differentPrompt']
        ] as const).map(([filter]) =>
            db.collection<{ id: string }>("jobs")
                .find(filter, { projection: { id: 1 } })
                .map(d => d.id).toArray()
                .then(ids => new Set(ids))
        )
    );
    const mustUpdate = (id: string) => withErrors.has(id) || outdated.has(id) || differentPrompt.has(id);
    scrapedJobs = scrapedJobs.filter(j => mustUpdate(j.id) || !notOutdated.has(j.id));
    const jobs: Job[] = [], rejects: Job[] = [], errors: Job[] = [];
    if (!scrapedJobs.length) return NextResponse.json({ jobs, rejects, errors }, { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) });
    let personalInformation: PersonalInformation;
    try { personalInformation = await fetchPersonalInformation(db); }
    catch (e: unknown) {
        let status = 500;
        let statusText = 'Error fetching personal information';
        if (typeof e === 'object' && e !== null) {
            if ('status' in e) {
                const rawStatus = (e as { status?: unknown }).status;
                if (typeof rawStatus === 'number') status = rawStatus;
            }
            if ('statusText' in e) {
                const rawText = (e as { statusText?: unknown }).statusText;
                if (typeof rawText === 'string') statusText = rawText;
            }
        }
        return NextResponse.json({}, { status, statusText, headers: corsHeaders(req.headers.get('origin') || undefined) });
    }
    const scrapedJobChunks = chunkArray(scrapedJobs, 5);
    const settled = await Promise.allSettled(scrapedJobChunks.map((chunk, chunkIndex) =>
        safeCall<Job[]>(`Filter chunk ${chunkIndex + 1}`, async () => {
            const agentOutput = z.object({ output: z.array(z.boolean()) });
            type AgentOutputType = z.infer<typeof agentOutput>;
            let jobIndex = 0;
            const result = (await runner.run(
                new Agent({
                    name: `Job Filter Agent chunk ${chunkIndex + 1}`,
                    model: 'gpt-5-nano',
                    modelSettings: { maxTokens: 16000, reasoning: { effort: 'high', summary: "detailed" } },
                    tools: [tool({
                        name: 'next_job',
                        description: 'Get next job or null.',
                        parameters: z.object({}),
                        execute: () => jobIndex < chunk.length ? chunk[jobIndex++] : (jobIndex = 0, null)
                    }), tool({
                        name: 'get_profile',
                        description: 'Return applicant profile.',
                        parameters: z.object({}),
                        execute: () => personalInformation
                    })],
                    instructions: promptDoc.prompt,
                    outputType: agentOutput
                }),
                'Decide suitability.'
            )).finalOutput as AgentOutputType | undefined;
            if (!result || !Array.isArray(result.output) || result.output.length !== chunk.length)
                throw new Error(`Invalid agent output (chunk ${chunkIndex + 1})`);
            return chunk.map((job, i) => ({
                ...job,
                filteredAt: new Date(),
                filterResult: typeof result.output[i] === 'boolean' ? result.output[i] : { error: 'Non-boolean output' },
                filteredBy: promptId
            }));
        })
    ));
    for (let i = 0; i < settled.length; i++) {
        const r = settled[i];
        if (r.status === 'fulfilled') {
            for (const job of r.value) {
                if (typeof job.filterResult === 'boolean') (job.filterResult ? jobs : rejects).push(job);
                else errors.push(job);
            }
        } else {
            console.error(`Chunk ${i + 1} failed:`, r.reason);
            for (const job of scrapedJobChunks[i]) {
                errors.push({
                    ...job,
                    filteredAt: new Date(),
                    filterResult: { error: `Chunk error: ${String(r.reason)}` },
                    filteredBy: promptId
                });
            }
        }
    }
    console.log(`Filtered jobs: ${jobs.length} accepted, ${rejects.length} rejected, ${errors.length} errors.`);
    await Promise.all([...jobs, ...rejects, ...errors].map(j =>
        mustUpdate(j.id)
            ? db.collection<Job>('jobs').updateOne({ id: j.id }, { $set: j })
            : db.collection<Job>('jobs').insertOne({ ...j })
    ));
    return NextResponse.json({ jobs, rejects, errors }, { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) });
}