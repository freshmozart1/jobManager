import { jsonError } from "@/lib/api";
import { JobNotFoundError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { JobDocument } from "@/types";
import { getDatabaseName, getUserId } from "@/lib/request";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const databaseName = getDatabaseName(req);
    if (!databaseName) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const db = (await mongoPromise).db(databaseName);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const origin = req.headers.get('origin') || undefined;
    const { id } = await params;
    const userId = getUserId(req);
    const job = await db.collection<JobDocument>('jobs').findOne(
        { userId, id },
        { projection: { _id: 0, userId: 0 } }
    );
    if (!job) return jsonError(404, JobNotFoundError.name, `Job ${id} not found`, origin);
    return NextResponse.json(job, { headers: corsHeaders(origin) });
}