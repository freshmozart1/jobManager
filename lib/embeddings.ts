import OpenAI from "openai";
import { NoOpenAIKeyError } from "@/lib/errors";
import { ScrapedJob, ScrapedJobEmbeddingFields } from "@/types";

export const EMBEDDING_MODEL = 'text-embedding-3-small';

let client: OpenAI | null = null;

function getClient() {
    if (client) return client;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new NoOpenAIKeyError();
    client = new OpenAI({ apiKey });
    return client;
}

export function buildJobEmbeddingInput(job: ScrapedJobEmbeddingFields): string {
    const salaryInfo = job.salaryInfo?.length ? job.salaryInfo.join('; ') : '';
    const benefits = job.benefits?.length ? job.benefits.join('; ') : '';
    const seniorityLevel = job.seniorityLevel ?? '';
    return [
        `Title: ${job.title}`,
        `Location: ${job.location}`,
        `Salary Info: ${salaryInfo}`,
        `Salary: ${job.salary}`,
        `Benefits: ${benefits}`,
        `Description: ${job.descriptionText}`,
        `Seniority Level: ${seniorityLevel}`,
        `Employment Type: ${job.employmentType}`
    ].join('\n').replace(/\s+/g, ' ').trim();
}

export async function embedJob(job: ScrapedJobEmbeddingFields): Promise<number[]> {
    const input = buildJobEmbeddingInput(job);
    const response = await getClient().embeddings.create({
        model: EMBEDDING_MODEL,
        input
    });
    return response.data[0].embedding;
}
export function buildEmbeddingFields(job: ScrapedJob): ScrapedJobEmbeddingFields | null {
    if (typeof job.title !== 'string') return null;
    if (typeof job.location !== 'string') return null;
    if (typeof job.salary !== 'string') return null;
    if (typeof job.descriptionText !== 'string') return null;
    if (typeof job.employmentType !== 'string') return null;

    return {
        title: job.title,
        location: job.location,
        salaryInfo: Array.isArray(job.salaryInfo) ? job.salaryInfo : [],
        salary: job.salary,
        benefits: Array.isArray(job.benefits) ? job.benefits : [],
        descriptionText: job.descriptionText,
        seniorityLevel: job.seniorityLevel,
        employmentType: job.employmentType
    };
}

