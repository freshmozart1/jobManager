import { jsonError } from "@/lib/api";
import { corsHeaders } from "@/lib/cors";
import { InvalidArtifactTypeError, JobArtifactNotReadyError, JobNotFoundError, MissingArtifactTypeQueryError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { Job, JobArtifactDocument, JobArtifactType } from "@/types";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES: JobArtifactType[] = ['cover-letter', 'cv'];

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });

    const origin = req.headers.get('origin') || undefined;
    const typeParam = req.nextUrl.searchParams.get('type');
    if (!typeParam) return jsonError(422, MissingArtifactTypeQueryError.name, 'Query parameter "type" is required', origin, { allowedTypes: ALLOWED_TYPES });

    const normalizedType = typeParam.toLowerCase();
    if (!ALLOWED_TYPES.includes(normalizedType as JobArtifactType)) {
        return jsonError(422, InvalidArtifactTypeError.name, `Invalid artifact type: ${typeParam}`, origin, { allowedTypes: ALLOWED_TYPES });
    }

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const { id } = await params;
    const job = await db.collection<Job>('jobs').findOne({ id }, { projection: { _id: 0, id: 1 } });
    if (!job) return jsonError(404, JobNotFoundError.name, `Job ${id} not found`, origin);

    const artifact = await db.collection<JobArtifactDocument>('jobArtifacts').findOne(
        { jobId: job.id, type: normalizedType as JobArtifactType },
        { projection: { _id: 0 } }
    );

    if (!artifact) {
        return jsonError(409, JobArtifactNotReadyError.name, `Artifact ${normalizedType} not generated`, origin);
    }

    const headers = {
        ...corsHeaders(origin),
        'Content-Type': artifact.contentType,
        'Content-Disposition': `attachment; filename="${artifact.fileName}"`,
        'Cache-Control': 'no-store'
    } as Record<string, string>;

    return new NextResponse(artifact.content, { headers });
}
