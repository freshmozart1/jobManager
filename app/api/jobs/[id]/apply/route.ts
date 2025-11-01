import { jsonError } from "@/lib/api";
import { corsHeaders } from "@/lib/cors";
import { InvalidAppliedAtError, JobAlreadyAppliedError, JobNotFoundError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { Job } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });

    const origin = req.headers.get('origin') || undefined;
    const body = await req.json().catch(() => ({}));
    const appliedAtInput = body?.appliedAt;
    const hasAppliedAt = appliedAtInput !== undefined;

    if (hasAppliedAt && typeof appliedAtInput !== 'string') {
        return jsonError(422, InvalidAppliedAtError.name, 'appliedAt must be an ISO timestamp string when provided', origin);
    }

    const timestamp = hasAppliedAt ? new Date(appliedAtInput) : new Date();
    if (Number.isNaN(timestamp.getTime())) {
        return jsonError(422, InvalidAppliedAtError.name, 'appliedAt must be a valid ISO timestamp', origin);
    }

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const { id } = await params;
    const job = await db.collection<Job>('jobs').findOne({ id }, { projection: { _id: 0, appliedAt: 1 } });
    if (!job) return jsonError(404, JobNotFoundError.name, `Job ${id} not found`, origin);

    if (job.appliedAt) {
        const existing = new Date(job.appliedAt);
        if (!Number.isNaN(existing.getTime())) {
            const existingIso = existing.toISOString();
            if (!hasAppliedAt || existing.getTime() === timestamp.getTime()) {
                return NextResponse.json({ appliedAt: existingIso }, { headers: corsHeaders(origin) });
            }
            return jsonError(409, JobAlreadyAppliedError.name, 'Job already marked as applied', origin, {
                appliedAt: existingIso
            });
        }
    }

    await db.collection<Job>('jobs').updateOne(
        { id },
        {
            $set: {
                appliedAt: timestamp
            }
        }
    );

    return NextResponse.json({ appliedAt: timestamp.toISOString() }, { headers: corsHeaders(origin) });
}
