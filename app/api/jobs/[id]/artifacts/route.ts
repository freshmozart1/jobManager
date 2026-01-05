import { jsonError } from "@/lib/api";
import { JOB_ARTIFACT_TYPES } from "@/lib/constants";
import { corsHeaders } from "@/lib/cors";
import { InvalidArtifactTypeError, JobNotFoundError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { Job, JobArtifact, JobArtifactType } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

type ArtifactRequestBody = {
    type: JobArtifactType;
    content: string;
    subject?: string;
    recipient?: string;
    applicant?: string;
};

function isValidArtifactType(type: unknown): type is JobArtifactType {
    return typeof type === 'string' && JOB_ARTIFACT_TYPES.includes(type as JobArtifactType);
}

async function upsertArtifact(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
    parseBody: () => Promise<ArtifactRequestBody>
) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) {
        return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    }

    const origin = req.headers.get('origin') || undefined;

    let body: ArtifactRequestBody;
    try {
        body = await parseBody();
    } catch {
        return jsonError(400, 'InvalidRequestBody', 'Request body must be valid JSON', origin);
    }

    const { type, content, subject, recipient, applicant } = body;

    if (!isValidArtifactType(type)) {
        return jsonError(422, InvalidArtifactTypeError.name, `Artifact type must be one of: ${JOB_ARTIFACT_TYPES.join(', ')}`, origin);
    }

    if (typeof content !== 'string') {
        return jsonError(422, 'InvalidContent', 'Content must be a string', origin);
    }

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });

    const { id } = await params;

    const job = await db.collection<Job>('jobs').findOne(
        { id },
        { projection: { _id: 0, id: 1, artifacts: 1 } }
    );

    if (!job) {
        return jsonError(404, JobNotFoundError.name, `Job ${id} not found`, origin);
    }

    const now = new Date();
    const existingArtifact = job.artifacts?.find(a => a.type === type);

    const artifact: JobArtifact = {
        type,
        content,
        ...(subject !== undefined && { subject }),
        ...(recipient !== undefined && { recipient }),
        ...(applicant !== undefined && { applicant }),
        createdAt: existingArtifact?.createdAt ?? now,
        updatedAt: now
    };

    if (existingArtifact) {
        // Update existing artifact using array filters
        await db.collection<Job>('jobs').updateOne(
            { id },
            {
                $set: {
                    'artifacts.$[elem]': artifact
                }
            },
            {
                arrayFilters: [{ 'elem.type': type }]
            }
        );
    } else {
        // Push new artifact to array (or initialize array if it doesn't exist)
        await db.collection<Job>('jobs').updateOne(
            { id },
            {
                $push: {
                    artifacts: artifact
                }
            }
        );
    }

    return NextResponse.json({ artifact }, { headers: corsHeaders(origin) });
}

// PUT handler for normal fetch calls with application/json
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return upsertArtifact(req, context, () => req.json());
}

// POST handler to support navigator.sendBeacon, which sends string payloads as
// "text/plain;charset=UTF-8" by default. We read the body as text and parse JSON
// here as a compatibility workaround, not as a general text/plain API contract.
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return upsertArtifact(req, context, async () => {
        const text = await req.text();
        return JSON.parse(text);
    });
}
