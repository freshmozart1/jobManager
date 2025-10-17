import z from "zod";
import { ApifyClient } from "apify-client";
import { Db, MongoClient } from "mongodb";
import { ZodType as ZodSchema } from "zod";
import { NoApifyTokenError, NoDatabaseNameError, NoMongoDBConnectionStringError, NoScrapeUrlsError, ParsingAfterScrapeError } from "./errors";
import { ZJob } from "./zodSchemas";


export async function scrapeJobs(db: Db, actorName: string, zodSchema: ZodSchema = z.array(ZJob)): Promise<Job[]> {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    if (!APIFY_TOKEN) throw new NoApifyTokenError();
    const apify = new ApifyClient({ token: APIFY_TOKEN });
    const scrapeIds = db.collection<ScrapeIdDocument>("scrapeIds");
    const scrapeUrls = db.collection<ScrapeUrlDocument>("scrapeUrls");
    const idsFromJobsCollection = await db.collection<Job>("jobs").find().project<{ id: string; }>({ id: 1 }).toArray().then(docs => new Set(docs.map(d => d.id)));
    const latestScrapeIdDocument = await scrapeIds.find().sort("cTimeMs", -1).limit(1).next();
    const parsedJobs = await zodSchema.safeParseAsync(latestScrapeIdDocument && Date.now() - Number(latestScrapeIdDocument.cTimeMs) < 864e5
        ? await apify.dataset(latestScrapeIdDocument.scrapeId).listItems().then(r => r.items.map(item => ({
            ...item,
            postedAt: typeof item.postedAt === "string" ? new Date(item.postedAt) : item.postedAt
        })))
        : await (async () => {
            const urls = await scrapeUrls.find().toArray().then(d => d.map(x => x.url));
            if (!urls.length) throw new NoScrapeUrlsError();
            const { defaultDatasetId } = await apify.actor(actorName).call({ urls, count: 100 });
            await scrapeIds.insertOne({ scrapeId: defaultDatasetId, cTimeMs: BigInt(Date.now()) });
            return apify.dataset(defaultDatasetId).listItems().then(r =>
                r.items.map(item => ({
                    ...item,
                    postedAt: typeof item.postedAt === "string" ? new Date(item.postedAt) : item.postedAt
                }))
            );
        })());
    if (!parsedJobs.success) throw new ParsingAfterScrapeError(parsedJobs.error);
    return parsedJobs.data.filter((job: Job) => !idsFromJobsCollection.has(job.id)); //TODO #4
}

export async function fetchJobs(): Promise<Job[]> {
    const { MONGODB_CONNECTION_STRING, DATABASE_NAME } = process.env;
    if (!MONGODB_CONNECTION_STRING) throw new NoMongoDBConnectionStringError();
    if (!DATABASE_NAME) throw new NoDatabaseNameError();
    const mongo = new MongoClient(MONGODB_CONNECTION_STRING);
    const db = mongo.db(DATABASE_NAME);
    try {
        return await db.collection<Job>("jobs").find({}, { projection: { _id: 0 } }).toArray();
    } finally {
        await mongo.close();
    }
}