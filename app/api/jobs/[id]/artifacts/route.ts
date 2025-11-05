import { jsonError } from "@/lib/api";
import { NoDatabaseNameError, NoOpenAIKeyError, MissingPromptIdInRequestBodyError } from "@/lib/errors";
import { safeCall } from "@/lib/safeCall";
import { completeAgentRun, startAgentRun, toUrl } from "@/lib/utils";
import { Job, PersonalInformation, PromptDocument } from "@/types";
import { Agent, Runner } from "@openai/agents";
import { ObjectId, WithId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    {
        params
    }: {
        params: Promise<{ id: string }>;
    }
) {
    const { id } = await params;
    const rawPromptId = req.nextUrl.searchParams.get('promptId');
    if (!rawPromptId || typeof rawPromptId !== 'string' || !ObjectId.isValid(rawPromptId)) {
        const error = new MissingPromptIdInRequestBodyError();
        return jsonError(400, error.name, error.message, req.headers.get('origin'));
    }
    const { DATABASE_NAME, OPENAI_API_KEY } = process.env;
    const missingEnv = !DATABASE_NAME ? NoDatabaseNameError.name :
        !OPENAI_API_KEY ? NoOpenAIKeyError.name : null;
    if (missingEnv) return jsonError(500, missingEnv, `Missing environment variable: ${missingEnv}`, req.headers.get('origin')); //todo #79
    const [promptResponse, personalInfoResponse, jobResponse] = await Promise.all([
        fetch(toUrl(`/api/prompts/${rawPromptId}`)),
        fetch(toUrl('/api/personal')),
        fetch(toUrl(`/api/jobs/${id}`))
    ]);
    if (!promptResponse.ok) {
        return jsonError(promptResponse.status, 'PromptFetchError', `Failed to fetch prompt ${rawPromptId}`, req.headers.get('origin'));
    }
    if (!personalInfoResponse.ok) {
        return jsonError(personalInfoResponse.status, 'PersonalInformationFetchError', 'Failed to fetch personal information', req.headers.get('origin'));
    }
    if (!jobResponse.ok) {
        return jsonError(jobResponse.status, 'JobFetchError', `Failed to fetch job ${id}`, req.headers.get('origin'));
    }
    const [{ prompt, updatedAt, createdAt }, personalInformation, job] = await Promise.all([
        promptResponse.json() as Promise<WithId<PromptDocument>>,
        personalInfoResponse.json() as Promise<PersonalInformation>,
        jobResponse.json() as Promise<Job>
    ]);
    const runner = new Runner({ workflowName: 'jobManager - write artifacts' });
    const runTrace = startAgentRun({
        agent: 'filter',
        promptVersion: new Date(updatedAt ?? createdAt).toISOString(),
        input: { job, personalInformation }
    });
    const letter = await safeCall<string>('Writer agent', async () => (await runner.run(new Agent({
        name: 'Cover letter agent',
        model: 'gpt-5',
        instructions: prompt,
        modelSettings: { reasoning: { effort: "high", summary: 'detailed' } }
    }), `Generate a personalized cover letter for the following job posting based on the provided personal information.\n\nJob Posting:\n${JSON.stringify(job, null, 2)}\n\nPersonal Information:\n${JSON.stringify(personalInformation, null, 2)}\n\n`)).finalOutput!);
    completeAgentRun(runTrace, { output: letter });
    return new NextResponse(letter, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
    })
}