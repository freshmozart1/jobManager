import { InvalidAgentTypeQueryParameterError, MissingSortOrOrderQueryParameterError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { PromptDocument } from "@/types";

/**
 * Prompt storage convention (deterministic templates)
 *
 * - Prompts are stored in the `prompts` collection with fields: {_id, agentType, name, createdAt, updatedAt, prompt}
 * - Each prompt should include a fixed, versioned prefix and postfix that set deterministic constraints
 *   Example:
 *     prefix (immutable):
 *       - "You are the Filter Agent v1.0.0. Follow instructions exactly."
 *       - "Output strictly matches the declared JSON schema."
 *     postfix (immutable):
 *       - "Do not include explanations."
 *       - "If uncertain, return the default false value."
 * - The variable middle section can be edited between versions, but prefix/postfix should be treated as locked to
 *   preserve behavior across runs and enable reproducibility.
 * - Consumers must reference a concrete prompt document by _id and treat updatedAt as the version watermark.
 */

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const agentType = (new URL(req.url)).searchParams.get('agentType');
    if (agentType !== 'filter' && agentType !== 'writer' && agentType !== 'evaluator' && agentType !== null) {
        return NextResponse.json({}, { status: 400, statusText: InvalidAgentTypeQueryParameterError.name, headers: corsHeaders(req.headers.get('origin') || undefined) });
    }
    const sort = (new URL(req.url)).searchParams.get('sort');
    const order = (new URL(req.url)).searchParams.get('order');
    const limit = (new URL(req.url)).searchParams.get('limit');
    const id = (new URL(req.url)).searchParams.get('id');
    if (id && ObjectId.isValid(id)) {
        const prompt = await db.collection<PromptDocument>('prompts').findOne({ _id: new ObjectId(id) });
        return NextResponse.json(prompt ? prompt : {}, { status: prompt ? 200 : 404, headers: corsHeaders(req.headers.get('origin') || undefined) });
    }
    if ((sort && !order) || (!sort && order)) {
        return NextResponse.json({}, { status: 400, statusText: MissingSortOrOrderQueryParameterError.name, headers: corsHeaders(req.headers.get('origin') || undefined) });
    }

    if (agentType && !['filter', 'writer', 'evaluator'].includes(agentType)) {
        return NextResponse.json({}, { status: 400, statusText: InvalidAgentTypeQueryParameterError.name, headers: corsHeaders(req.headers.get('origin') || undefined) });
    }
    const prompts = await db.collection<PromptDocument>('prompts').find(agentType ? { agentType } : {}, {
        sort: sort ? { [sort]: order === 'asc' ? 1 : -1 } : undefined,
        limit: limit ? parseInt(limit) : undefined
    }).toArray();
    return NextResponse.json(
        prompts.length ? prompts : {},
        { status: prompts.length ? 200 : 404, headers: corsHeaders(req.headers.get('origin') || undefined) }
    );
}