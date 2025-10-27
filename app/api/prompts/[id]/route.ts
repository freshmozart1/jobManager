import { NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { PromptDocument } from "@/types";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });

    const { id } = await params;
    const origin = req.headers.get('origin') || undefined;

    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400, headers: corsHeaders(origin) });
    }

    const prompt = await db.collection<PromptDocument>('prompts').findOne({ _id: new ObjectId(id) });

    if (!prompt) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404, headers: corsHeaders(origin) });
    }

    return NextResponse.json(prompt, { headers: corsHeaders(origin) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });

    const { id } = await params;
    const origin = req.headers.get('origin') || undefined;

    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400, headers: corsHeaders(origin) });
    }

    const body = await req.json();
    const { name, prompt, agentType } = body;

    if (!name?.trim() || !prompt?.trim() || !agentType) {
        return NextResponse.json(
            { error: 'Missing required fields: name, prompt, and agentType are required' },
            { status: 400, headers: corsHeaders(origin) }
        );
    }

    if (!['filter', 'writer', 'evaluator'].includes(agentType)) {
        return NextResponse.json(
            { error: 'Invalid agentType. Must be one of: filter, writer, evaluator' },
            { status: 400, headers: corsHeaders(origin) }
        );
    }

    const updateResult = await db.collection<PromptDocument>('prompts').updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                name,
                prompt,
                agentType,
                updatedAt: new Date()
            }
        }
    );

    if (updateResult.matchedCount === 0) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404, headers: corsHeaders(origin) });
    }

    const updatedPrompt = await db.collection<PromptDocument>('prompts').findOne({ _id: new ObjectId(id) });

    return NextResponse.json(updatedPrompt, { headers: corsHeaders(origin) });
}
