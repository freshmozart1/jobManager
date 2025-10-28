import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { fetchPersonalInformation } from "@/lib/personal";
import { NextResponse } from "next/server";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET() {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    return NextResponse.json(await fetchPersonalInformation(db), { headers: corsHeaders() });
}

//todo #24