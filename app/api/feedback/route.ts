import { jsonError } from "@/lib/api";
import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError, NoOpenAIKeyError } from "@/lib/errors";
import { embedJob, EMBEDDING_MODEL } from "@/lib/embeddings";
import mongoPromise from "@/lib/mongodb";
import { getDatabaseName, getUserId } from "@/lib/request";
import { meanVector, normalizeVector } from "@/lib/vector";
import { ComparisonVectors, JobDocument, JobEmbedding, JobFeedback, JobFeedbackLabel, ScrapedJob } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { buildEmbeddingFields } from "@/lib/embeddings";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

type FeedbackRequestBody = {
    job: ScrapedJob;
    label: JobFeedbackLabel;
};


export async function POST(req: NextRequest) {
    const origin = req.headers.get('origin') || undefined;
    const databaseName = getDatabaseName(req);
    if (!databaseName) {
        return jsonError(500, NoDatabaseNameError.name, 'DATABASE_NAME environment variable not set', origin);
    }

    let body: FeedbackRequestBody;
    try {
        body = await req.json();
    } catch {
        return jsonError(400, 'InvalidRequestBody', 'Request body must be valid JSON', origin);
    }

    if (!body?.job || (body.label !== 'like' && body.label !== 'dislike')) {
        return jsonError(422, 'InvalidFeedbackPayload', 'Payload must include job and label (like or dislike)', origin);
    }

    if (typeof body.job.id !== 'string' || !body.job.id.trim()) {
        return jsonError(422, 'InvalidJobId', 'Job must include a valid id', origin);
    }

    const embeddingFields = buildEmbeddingFields(body.job);
    if (!embeddingFields) {
        return jsonError(422, 'InvalidJobFields', 'Job must include required embedding fields', origin);
    }

    const userId = getUserId(req);
    const now = new Date();

    const db = (await mongoPromise).db(databaseName);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });

    await Promise.all([
        db.collection<JobFeedback>('jobFeedback').findOneAndUpdate(
            { userId, jobId: body.job.id },
            {
                $set: {
                    label: body.label,
                    job: embeddingFields,
                    updatedAt: now
                },
                $setOnInsert: {
                    createdAt: now
                }
            },
            { upsert: true }
        ),
        db.collection<JobDocument>('jobs').updateOne(
            { userId, id: body.job.id },
            {
                $set: {
                    ...body.job,
                    userId,
                    filteredAt: now,
                    filterResult: body.label === 'like'
                }
            },
            { upsert: true }
        )
    ]);

    let feedbackDocs: JobFeedback[] = [];
    try {
        feedbackDocs = await db.collection<JobFeedback>('jobFeedback').find({ userId }).toArray();
    } catch (error) {
        return jsonError(500, 'JobFeedbackReadError', 'Failed to read job feedback', origin, { error });
    }

    const likeFeedback = feedbackDocs.filter(item => item.label === 'like');
    const dislikeFeedback = feedbackDocs.filter(item => item.label === 'dislike');

    const embeddingMap = new Map<string, number[]>((await db.collection<JobEmbedding>('jobEmbeddings').find({
        userId,
        jobId: { $in: feedbackDocs.map(item => item.jobId) },
        model: EMBEDDING_MODEL
    }).toArray()).map(item => [item.jobId, item.embedding]));

    for (const feedback of feedbackDocs) {
        if (embeddingMap.has(feedback.jobId)) continue;
        try {
            const embedding = await embedJob(feedback.job);
            embeddingMap.set(feedback.jobId, embedding);
            await db.collection<JobEmbedding>('jobEmbeddings').updateOne(
                { userId, jobId: feedback.jobId, model: EMBEDDING_MODEL },
                {
                    $set: {
                        embedding,
                        updatedAt: now
                    },
                    $setOnInsert: {
                        createdAt: now
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            if (error instanceof NoOpenAIKeyError) {
                return jsonError(500, NoOpenAIKeyError.name, error.message, origin);
            }
            return jsonError(500, 'EmbeddingError', 'Failed to create job embeddings', origin, { error });
        }
    }

    const positiveMean = meanVector(likeFeedback.map(item => embeddingMap.get(item.jobId)).filter(Boolean) as number[][]);
    const negativeMean = meanVector(dislikeFeedback.map(item => embeddingMap.get(item.jobId)).filter(Boolean) as number[][]);

    await db.collection<ComparisonVectors>('comparisonVectors').updateOne(
        { userId, model: EMBEDDING_MODEL },
        {
            $set: {
                userId,
                model: EMBEDDING_MODEL,
                positive: positiveMean ? normalizeVector(positiveMean) : null,
                negative: negativeMean ? normalizeVector(negativeMean) : null,
                likesCount: likeFeedback.length,
                dislikesCount: dislikeFeedback.length,
                updatedAt: now
            }
        },
        { upsert: true }
    );

    return NextResponse.json(
        {
            likesCount: likeFeedback.length,
            dislikesCount: dislikeFeedback.length,
            model: EMBEDDING_MODEL
        },
        { headers: corsHeaders(origin) }
    );
}
