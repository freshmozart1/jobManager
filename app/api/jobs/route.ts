import { NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: Request) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const origin = req.headers.get('origin') || undefined;
    
    // Parse query parameter for filterResult
    const url = new URL(req.url);
    const filterParam = url.searchParams.get('filterResult');
    
    // Build MongoDB query based on filterResult parameter
    const query: Record<string, any> = {};
    if (filterParam === 'true') {
        query.filterResult = true;
    } else if (filterParam === 'false') {
        query.filterResult = false;
    } else if (filterParam === 'error') {
        query['filterResult.error'] = { $exists: true };
    } else if (filterParam === 'undefined') {
        query.filterResult = { $exists: false };
    }
    // If filterParam is null or any other value, return all jobs (empty query)
    
    return NextResponse.json(
        await db.collection<Job>('jobs').find(query, { projection: { _id: 0 } }).toArray(),
        { headers: corsHeaders(origin) }
    );
}