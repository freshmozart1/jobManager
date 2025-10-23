import { InvalidAgentTypeQueryParameterError, MissingSortOrOrderQueryParameterError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const agentType = (new URL(req.url)).searchParams.get('agentType');
    const sort = (new URL(req.url)).searchParams.get('sort');
    const order = (new URL(req.url)).searchParams.get('order');
    const limit = (new URL(req.url)).searchParams.get('limit');
    const id = (new URL(req.url)).searchParams.get('id');
    if (id && ObjectId.isValid(id)) {
        const prompt = await db.collection<PromptDocument>('prompts').findOne({ _id: new ObjectId(id) });
        return NextResponse.json(prompt ? prompt : {}, { status: prompt ? 200 : 404 });
    }
    if ((sort && !order) || (!sort && order)) {
        return NextResponse.json({}, { status: 400, statusText: MissingSortOrOrderQueryParameterError.name });
    }

    if (agentType && !['filter', 'writer', 'evaluator'].includes(agentType)) {
        return NextResponse.json({}, { status: 400, statusText: InvalidAgentTypeQueryParameterError.name });
    }
    const prompts = await db.collection<PromptDocument>('prompts').find(agentType ? { agentType: agentType as AgentType } : {}, {
        sort: sort ? { [sort]: order === 'asc' ? 1 : -1 } : undefined,
        limit: limit ? parseInt(limit) : undefined
    }).toArray();
    return NextResponse.json(
        prompts.length ? prompts : {},
        { status: prompts.length ? 200 : 404 }
    );
}