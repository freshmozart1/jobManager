import { jsonError } from "@/lib/api";
import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { ScrapedJob } from "@/types";
import { ApifyClient } from "apify-client";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest): Promise<ReturnType<typeof jsonError> | NextResponse<ScrapedJob[]>> {
    const { APIFY_TOKEN, DATABASE_NAME } = process.env;
    const databaseName = req.headers.get('x-test-db') || DATABASE_NAME;
    const actorName = req.nextUrl.searchParams.get('actorName');
    const missingEnv = !databaseName
        ? new NoDatabaseNameError()
        : !APIFY_TOKEN
            ? new Error('Missing Apify token in environment variables')
            : !actorName
                ? new Error('Missing actorName query parameter')
                : null;
    if (missingEnv) return jsonError(500, missingEnv.name, missingEnv.message, req.headers.get('origin'), missingEnv.stack ? { stack: missingEnv.stack } : undefined);
    const db = (await mongoPromise).db(databaseName);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const urls = await db.collection<{
        _id: ObjectId;
        url: string;
    }>("scrapeUrls").find().toArray().then(d => d.map(x => x.url));
    const apify = new ApifyClient({ token: APIFY_TOKEN });
    if (!urls.length) return jsonError(500, 'NoScrapeUrlsError', 'No scrape URLs found in the database', req.headers.get('origin'));
    if (!(await apify.actor(actorName!).get())) return jsonError(404, 'ActorNotFoundError', `Actor with name "${actorName}" not found on Apify`, req.headers.get('origin'));
    const lastRun = await apify.actor(actorName!).runs().list({ limit: 1, desc: true }).then(r => r.items[0]);
    return NextResponse.json(
        lastRun && lastRun.startedAt.toDateString() === new Date().toDateString()
            ? (await apify.dataset<ScrapedJob>(lastRun.defaultDatasetId!).listItems()).items
            : (await apify.actor(actorName!).call({ urls, count: req.nextUrl.searchParams.get('count') || 100 }).then(run =>
                apify.dataset<ScrapedJob>(run.defaultDatasetId!).listItems()
            )).items,
        { status: 200, headers: corsHeaders(req.headers.get('origin') || undefined) }
    );
}