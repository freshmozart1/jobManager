import { jsonError } from "@/lib/api";
import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { getDatabaseName } from "@/lib/request";
import { ScrapedJob } from "@/types";
import { ApifyClient } from "apify-client";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest): Promise<ReturnType<typeof jsonError> | NextResponse<ScrapedJob[]>> {
    const { APIFY_TOKEN } = process.env;
    const databaseName = getDatabaseName(req);
    const actorName = req.nextUrl.searchParams.get('actorName');
    const missingEnv = !databaseName
        ? new NoDatabaseNameError()
        : !APIFY_TOKEN
            ? new Error('Missing Apify token in environment variables')
            : null;
    if (missingEnv) return jsonError(500, missingEnv.name, missingEnv.message, req.headers.get('origin'), missingEnv.stack ? { stack: missingEnv.stack } : undefined);
    const apify = new ApifyClient({ token: APIFY_TOKEN });
    if (!(await apify.actor(actorName!).get())) return jsonError(404, 'ActorNotFoundError', `Actor with name "${actorName}" not found on Apify`, req.headers.get('origin'));
    const db = (await mongoPromise).db(databaseName);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const urls = await db.collection<{
        _id: ObjectId;
        url: string;
    }>("scrapeUrls").find().toArray().then(d => d.map(x => x.url));
    if (!urls.length) return jsonError(500, 'NoScrapeUrlsError', 'No scrape URLs found in the database', req.headers.get('origin'));
    const lastRun = await apify.actor(actorName!).runs().list({ limit: 1, desc: true }).then(r => r.items[0]);
    const lastRunToday = lastRun && lastRun.startedAt.toDateString() === new Date().toDateString();
    const lastRunItems = lastRunToday
        ? await apify.dataset<ScrapedJob>(lastRun.defaultDatasetId!).listItems().then(r => r.items)
        : null;
    const itemCount = Number(req.nextUrl.searchParams.get('count')) || 100;
    let scrapedJobs: ScrapedJob[];
    if (!lastRunItems || lastRunItems.length < itemCount || !lastRunToday) {
        scrapedJobs = (await apify.actor(actorName!).call({ urls, count: itemCount < 100 ? 100 : itemCount }).then(run =>
            apify.dataset<ScrapedJob>(run.defaultDatasetId).listItems()
        )).items;
    } else {
        scrapedJobs = lastRunItems;
    }
    const existingIdSet = new Set(await db.collection<{ id: string }>("jobs").distinct("id"));
    scrapedJobs = scrapedJobs.filter(job => !existingIdSet.has(job.id));
    return NextResponse.json(
        scrapedJobs.slice(0, itemCount < scrapedJobs.length ? itemCount : scrapedJobs.length),
        { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) }
    );
}