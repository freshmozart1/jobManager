import { NoDatabaseNameError } from "@/lib/errors";
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
    return NextResponse.json(
        await db.collection<Job>('jobs').find({ id: (await params).id }, { projection: { _id: 0 } }).toArray(),
        { headers: corsHeaders(origin) }
    );
}