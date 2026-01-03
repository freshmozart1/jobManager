import { jsonError } from "@/lib/api";
import { corsHeaders } from "@/lib/cors";
import { InvalidAppliedAtError, JobNotFoundError, NoDatabaseNameError } from "@/lib/errors";
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
    const isClear = appliedAtInput === null;

    if (hasAppliedAt && !isClear && typeof appliedAtInput !== 'string') {
        return jsonError(422, InvalidAppliedAtError.name, 'appliedAt must be an ISO timestamp string or null when provided', origin);
    }

    let timestamp: Date | null = null;
    if (!isClear) {
        timestamp = hasAppliedAt ? new Date(appliedAtInput) : new Date();
        if (Number.isNaN(timestamp.getTime())) {
            return jsonError(422, InvalidAppliedAtError.name, 'appliedAt must be a valid ISO timestamp', origin);
        }
    }

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const { id } = await params;
    const job = await db.collection<Job>('jobs').findOne({ id }, { projection: { _id: 0, appliedAt: 1 } });
    if (!job) return jsonError(404, JobNotFoundError.name, `Job ${id} not found`, origin);

    if (isClear) {
        await db.collection<Job>('jobs').updateOne(
            { id },
            { $unset: { appliedAt: "" } }
        );
        return NextResponse.json({ appliedAt: null }, { headers: corsHeaders(origin) });
    }

    await db.collection<Job>('jobs').updateOne(
        { id },
        { $set: { appliedAt: timestamp as Date } }
    );

    return NextResponse.json({ appliedAt: timestamp!.toISOString() }, { headers: corsHeaders(origin) });
}
