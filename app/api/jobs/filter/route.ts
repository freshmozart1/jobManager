import { jsonError } from "@/lib/api";
import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError, NoOpenAIKeyError } from "@/lib/errors";
import { embedJob, EMBEDDING_MODEL, buildEmbeddingFields } from "@/lib/embeddings";
import mongoPromise from "@/lib/mongodb";
import { getDatabaseName, getUserId } from "@/lib/request";
import { cosineSimilarity } from "@/lib/vector";
import { ComparisonVectors, JobDocument, ScrapedJob } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

type FilterRequestBody = {
    job: ScrapedJob;
};

export async function POST(req: NextRequest) {
    const origin = req.headers.get('origin') || undefined;
    const databaseName = getDatabaseName(req);
    if (!databaseName) {
        return jsonError(500, NoDatabaseNameError.name, 'DATABASE_NAME environment variable not set', origin);
    }

    let body: FilterRequestBody;
    try {
        body = await req.json();
    } catch {
        return jsonError(400, 'InvalidRequestBody', 'Request body must be valid JSON', origin);
    }

    if (!body?.job || typeof body.job.id !== 'string') {
        return jsonError(422, 'InvalidJobPayload', 'Payload must include a valid job', origin);
    }


    const userId = getUserId(req);
    const now = new Date();

    const db = (await mongoPromise).db(databaseName);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });

    const comparison = await db.collection<ComparisonVectors>('comparisonVectors').findOne(
        { userId, model: EMBEDDING_MODEL },
        { projection: { _id: 0 } }
    );

    const positive = comparison?.positive ?? null;
    const negative = comparison?.negative ?? null;
    const updateJobsCollection = (filterResult: boolean) => db.collection<JobDocument>('jobs').updateOne(
        { userId, id: body.job.id },
        {
            $set: {
                ...body.job,
                userId,
                filteredAt: now,
                filterResult
            }
        },
        { upsert: true }
    );

    if (!positive) {
        await updateJobsCollection(false);
        return NextResponse.json(
            { filterResult: false, reason: 'no-likes' },
            { headers: corsHeaders(origin) }
        );
    }

    const embeddingFields = buildEmbeddingFields(body.job);
    if (!embeddingFields) return jsonError(422, 'InvalidJobFields', 'Job must include required embedding fields', origin);
    let newEmbedding: number[];
    try {
        newEmbedding = await embedJob(embeddingFields);
    } catch (error) {
        if (error instanceof NoOpenAIKeyError) {
            return jsonError(500, NoOpenAIKeyError.name, error.message, origin);
        }
        return jsonError(500, 'EmbeddingError', 'Failed to create job embedding', origin, { error });
    }

    const sPositive = cosineSimilarity(positive, newEmbedding);
    const sNegative = negative ? cosineSimilarity(negative, newEmbedding) : null;

    const filterResult = negative
        ? sPositive > (sNegative ?? 0)
        : sPositive > 0.3;

    await updateJobsCollection(filterResult);

    return NextResponse.json(
        {
            filterResult,
            sPositive,
            sNegative,
            model: EMBEDDING_MODEL
        },
        { headers: corsHeaders(origin) }
    );
}
