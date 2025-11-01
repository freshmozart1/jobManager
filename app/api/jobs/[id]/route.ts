import { jsonError } from "@/lib/api";
import { JobNotFoundError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { Job } from "@/types";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const origin = req.headers.get('origin') || undefined;
    const { id } = await params;
    const job = await db.collection<Job>('jobs').findOne({ id }, { projection: { _id: 0 } });
    if (!job) return jsonError(404, JobNotFoundError.name, `Job ${id} not found`, origin);
    return NextResponse.json(job, { headers: corsHeaders(origin) });
}