import { corsHeaders } from "@/lib/cors";
import { MissingPromptIdInRequestBodyError, NoActorQueryParameterError, NoApifyTokenError, NoDatabaseNameError, NoOpenAIKeyError, NoScrapeUrlsError, PromptNotFoundError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { chunkArray, toUrl, startAgentRun, completeAgentRun } from "@/lib/utils";
import { Job, PersonalInformation, PromptDocument, ScrapedJob } from "@/types";
import { Agent, Runner, tool } from "@openai/agents";
import { ApifyClient } from "apify-client";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { safeCall } from "@/lib/safeCall";

type ScrapeUrlDocument = {
    _id: ObjectId;
    url: string;
};

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
    const runner = new Runner({ workflowName: 'jobManager - filter jobs' });
    const { APIFY_TOKEN, DATABASE_NAME, OPENAI_API_KEY } = process.env;
    const headerDbName = req.headers.get('x-test-db') || undefined;
    const effectiveDbName = headerDbName ?? DATABASE_NAME;
    const missingEnv = !effectiveDbName ? NoDatabaseNameError.name :
        !OPENAI_API_KEY ? NoOpenAIKeyError.name :
            !APIFY_TOKEN ? NoApifyTokenError.name : null;
    if (missingEnv) return NextResponse.json({}, { status: 500, statusText: missingEnv });
    const { promptId: rawPromptId, actorName } = await req.json() as { promptId?: string; actorName?: string; };
    if (!rawPromptId || !ObjectId.isValid(rawPromptId)) return NextResponse.json({}, { status: 400, statusText: MissingPromptIdInRequestBodyError.name });
    if (!actorName) return NextResponse.json({}, { status: 400, statusText: NoActorQueryParameterError.name });
    const promptId = new ObjectId(rawPromptId);
    const db = (await mongoPromise).db(effectiveDbName);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const urls = await db.collection<ScrapeUrlDocument>("scrapeUrls").find().toArray().then(d => d.map(x => x.url));
    if (!urls.length) return NextResponse.json({}, { status: 500, statusText: NoScrapeUrlsError.name });
    const promptDoc = await db.collection<PromptDocument>('prompts')
        .findOne({ _id: promptId }, { projection: { prompt: 1, updatedAt: 1 } });
    if (!promptDoc) return NextResponse.json({}, { status: 404, statusText: PromptNotFoundError.name });
    const apify = new ApifyClient({ token: APIFY_TOKEN });
    const [lastRun, skipIds] = await Promise.all([
        apify.actor(actorName).runs().list({ limit: 1, desc: true }).then(r => r.items[0]),
        db.collection<{ id: string }>('jobs').aggregate<{ id: string }>([
            {
                $match: {
                    filteredBy: promptId,
                    filteredAt: { $gte: promptDoc.updatedAt },
                    'filterResult.error': { $exists: false }
                },
            },
            {
                $project: { _id: 0, id: 1 }
            }
        ]).toArray().then(docs => new Set(docs.map(x => x.id)))
    ]);
    const scrapedJobs = (lastRun && lastRun.startedAt.toDateString() === new Date().toDateString()
        ? (await apify.dataset<ScrapedJob>(lastRun.defaultDatasetId!).listItems()).items
        : (await apify.actor(actorName).call({ urls, count: 100 }).then(run =>
            apify.dataset<ScrapedJob>(run.defaultDatasetId!).listItems()
        )).items).filter(j => !skipIds.has(j.id));
    const jobs: Job[] = [], rejects: Job[] = [], errors: Job[] = [];
    if (!scrapedJobs.length) return NextResponse.json({ jobs, rejects, errors }, { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) });
    const personalInformationResponse = await fetch(toUrl('/api/personal'));
    if (!personalInformationResponse.ok) {
        console.error('Failed to fetch personal information:', personalInformationResponse.statusText);
        return NextResponse.json({}, { status: personalInformationResponse.status, statusText: personalInformationResponse.statusText, headers: corsHeaders(req.headers.get('origin') || undefined) });
    }
    const personalInformation: PersonalInformation = await personalInformationResponse.json();
    const runTrace = startAgentRun({
        agent: 'filter',
        promptVersion: promptId.toString(),
        input: { jobsCount: scrapedJobs.length, promptId }
    });
    const scrapedJobChunks = chunkArray(scrapedJobs, 1);
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
                        execute: () => jobIndex < chunk.length ? chunk[jobIndex++] : null
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
                filteredBy: promptId,
                generation: []
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
    await Promise.all([...jobs, ...rejects, ...errors].map(job => db.collection<Job>('jobs').updateOne(
        { id: job.id },
        { $set: job },
        { upsert: true }
    )));
    completeAgentRun(runTrace, {
        output: { accepted: jobs.length, rejected: rejects.length, errors: errors.length }
    });
    return NextResponse.json({ jobs, rejects, errors }, { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) });
}