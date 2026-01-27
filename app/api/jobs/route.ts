import { NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { Job } from "@/types";

/**
 * Handles CORS preflight requests for the jobs API route.
 */
export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

/**
 * Returns jobs, optionally filtered by `filterResult`.
 *
 * Query params:
 * - `filterResult=true|false|error|undefined`
 * - `filter=relevant` (alias for `filterResult=true`)
 *
 * Behavior:
 * - `true` => `filterResult: true`
 * - `false` => `filterResult: false`
 * - `error` => `filterResult.error` exists
 * - `undefined` => `filterResult` missing
 * - otherwise returns all jobs
 *
 * Uses CORS headers based on the request `origin`.
 */
export async function GET(req: Request) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const origin = req.headers.get('origin') || undefined;

    // Parse query parameters
    const url = new URL(req.url);
    const filterResultParam = url.searchParams.get('filterResult');
    const filterAlias = url.searchParams.get('filter'); // e.g., filter=relevant

    // Build MongoDB query based on filterResult parameter
    const query: Record<string, boolean | { $exists: boolean } | { error: { $exists: boolean } }> = {};
    const filterParam = filterResultParam ?? (filterAlias === 'relevant' ? 'true' : undefined);
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