import { jsonError } from "@/lib/api";
import { corsHeaders } from "@/lib/cors";
import { InvalidGenerationTypesError, JobGenerationFailedError, JobNotFoundError, NoDatabaseNameError, ProfileIncompleteError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { fetchPersonalInformation } from "@/lib/personal";
import { completeAgentRun, startAgentRun } from "@/lib/utils";
import { Job, JobArtifactDocument, JobArtifactType, JobGenerationArtifact, PersonalInformation } from "@/types";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES: JobArtifactType[] = ['cover-letter', 'cv'];
const DEFAULT_TYPES = ALLOWED_TYPES;

function normalizeTypes(raw: unknown): { ok: true; types: JobArtifactType[] } | { ok: false } {
    if (raw === undefined) return { ok: true, types: [...DEFAULT_TYPES] };
    if (!Array.isArray(raw)) return { ok: false };
    const normalized = raw
        .filter((entry): entry is string => typeof entry === 'string')
        .map(entry => entry.toLowerCase());
    if (!normalized.length) return { ok: true, types: [...DEFAULT_TYPES] };
    const unique = Array.from(new Set(normalized));
    const invalid = unique.filter(entry => !ALLOWED_TYPES.includes(entry as JobArtifactType));
    if (invalid.length) return { ok: false };
    return { ok: true, types: unique as JobArtifactType[] };
}

function buildCoverLetter(job: Job, profile: PersonalInformation): string {
    return [
        profile.contact.name,
        profile.contact.email,
        profile.contact.phone,
        '',
        `Hiring Team, ${job.companyName}`,
        '',
        `Re: ${job.title}`,
        '',
        `I am excited to apply for the ${job.title} role at ${job.companyName}. My recent work on ${profile.experience.achievements[0]?.brief ?? 'modern applications'} demonstrates the impact I can deliver.`,
        '',
        `Key strengths:`,
        `- ${profile.skills[0]?.name ?? 'Software Engineering'} expertise with ${profile.skills[0]?.years ?? 0} years of hands-on experience.`,
        `- Proven track record delivering value in ${profile.experience.domains[0] ?? 'product engineering'}.`,
        '',
        `I would welcome the opportunity to discuss how I can contribute to ${job.companyName}.`,
        '',
        'Sincerely,',
        profile.contact.name
    ].join('\n');
}

function buildCv(job: Job, profile: PersonalInformation): string {
    return [
        `${profile.contact.name} — Curriculum Vitae`,
        '',
        `Role Target: ${job.title} (${job.location})`,
        '',
        'Experience Highlights:',
        ...profile.experience.recent_titles.map(title => `- ${title}`),
        '',
        'Key Skills:',
        ...profile.skills.slice(0, 5).map(skill => `- ${skill.name} (${skill.level})`)
    ].join('\n');
}

function buildArtifact(type: JobArtifactType, job: Job, profile: PersonalInformation): { content: string; contentType: string; fileName: string; summary: JobGenerationArtifact } {
    const createdAt = new Date();
    if (type === 'cover-letter') {
        const content = buildCoverLetter(job, profile);
        return {
            content,
            contentType: 'text/plain; charset=utf-8',
            fileName: `job-${job.id}-cover-letter.pdf`,
            summary: { type, contentType: 'text/plain; charset=utf-8', fileName: `job-${job.id}-cover-letter.pdf`, createdAt }
        };
    }
    const content = buildCv(job, profile);
    return {
        content,
        contentType: 'text/plain; charset=utf-8',
        fileName: `job-${job.id}-cv.pdf`,
        summary: { type, contentType: 'text/plain; charset=utf-8', fileName: `job-${job.id}-cv.pdf`, createdAt }
    };
}

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });

    const body = await req.json().catch(() => ({}));
    const origin = req.headers.get('origin') || undefined;
    const normalized = normalizeTypes(body?.types);
    if (!normalized.ok) {
        return jsonError(422, InvalidGenerationTypesError.name, 'types must be an array containing any of: cover-letter, cv', origin, {
            allowedTypes: ALLOWED_TYPES
        });
    }

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    const { id } = await params;
    const job = await db.collection<Job>('jobs').findOne({ id }, { projection: { _id: 0 } });
    if (!job) return jsonError(404, JobNotFoundError.name, `Job ${id} not found`, origin);

    let personalInformation: PersonalInformation;
    try {
        personalInformation = await fetchPersonalInformation(db);
    } catch (error) {
        if (error && typeof error === 'object' && 'statusText' in error) {
            const missing = (error as { statusText?: unknown }).statusText;
            return jsonError(409, ProfileIncompleteError.name, 'Personal profile incomplete', origin, {
                missingFields: missing ? [missing] : []
            });
        }
        return jsonError(500, ProfileIncompleteError.name, 'Unable to load personal profile', origin);
    }

    const trace = startAgentRun({
        agent: 'writer',
        promptVersion: 'baseline-writer-v1',
        input: {
            jobId: job.id,
            types: normalized.types
        }
    });

    try {
        const summaries: JobGenerationArtifact[] = [];
        for (const type of normalized.types) {
            const artifact = buildArtifact(type, job, personalInformation);
            summaries.push(artifact.summary);
            await db.collection<JobArtifactDocument>('jobArtifacts').updateOne(
                { jobId: job.id, type },
                {
                    $set: {
                        jobId: job.id,
                        runId: trace.runId,
                        type,
                        contentType: artifact.contentType,
                        fileName: artifact.fileName,
                        content: artifact.content,
                        createdAt: artifact.summary.createdAt
                    }
                },
                { upsert: true }
            );
        }

        await db.collection<Job>('jobs').updateOne(
            { id: job.id },
            {
                $set: {
                    generation: {
                        runId: trace.runId,
                        generatedAt: new Date(),
                        types: normalized.types,
                        artifacts: summaries
                    }
                }
            }
        );

        completeAgentRun(trace, {
            output: {
                artifacts: summaries.map(summary => ({ type: summary.type, fileName: summary.fileName }))
            }
        });

        return NextResponse.json(
            {
                runId: trace.runId,
                artifacts: summaries.map(summary => ({
                    type: summary.type,
                    url: `/api/jobs/${job.id}/download?type=${summary.type}`
                }))
            },
            { status: 202, headers: corsHeaders(origin) }
        );
    } catch (error) {
        completeAgentRun(trace, { error });
        return jsonError(500, JobGenerationFailedError.name, 'Failed to generate job artifacts', origin);
    }
}
