import { jsonError } from "@/lib/api";
import { JOB_ARTIFACT_TYPES } from "@/lib/constants";
import { corsHeaders } from "@/lib/cors";
import { InvalidArtifactTypeError, JobNotFoundError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { Job, JobArtifact, JobArtifactType } from "@/types";
import { CvModel } from "@/lib/cvModel";
import { NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

type CoverLetterRequestBody = {
    type: 'cover-letter';
    content: string;
    subject?: string;
    recipient?: string;
    applicant?: string;
};

type CvRequestBody = {
    type: 'cv';
    content: CvModel;
};

type ArtifactRequestBody = CoverLetterRequestBody | CvRequestBody;

/**
 * Validate YYYY-MM date format and month range
 */
function isValidYYYYMM(dateStr: string): boolean {
    const match = dateStr.match(/^(\d{4})-(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[2], 10);
    return month >= 1 && month <= 12;
}

/**
 * Validate CV artifact structure
 */
function validateCvContent(content: unknown): boolean {
    if (typeof content !== 'object' || content === null) {
        return false;
    }

    const { templateId, header, slots } = content as CvModel;

    // Required keys
    if (!templateId || !header || !slots) {
        return false;
    }

    // Header validation
    const { name, email, phone, location } = header;
    if (
        (typeof name !== 'string' || name.trim() === '') ||
        (typeof email !== 'string' || email.trim() === '') ||
        (typeof phone !== 'string' || phone.trim() === '') ||
        (location !== undefined && (typeof location !== 'string' || location.trim() === ''))
    ) return false;

    // Slots validation
    const { education, experience, skills } = slots;
    if (
        !Array.isArray(education) || // Education (may be empty)
        (!Array.isArray(experience) || experience.length === 0) || // Experience (must be non-empty)
        (!Array.isArray(skills) || skills.length === 0) // Skills (must be non-empty)
    ) return false;

    for (const { degree, field, institution, graduation_year } of education) if (
        (typeof degree !== 'string' || degree.trim() === '') ||
        (typeof field !== 'string' || field.trim() === '') ||
        (typeof institution !== 'string' || institution.trim() === '') ||
        (typeof graduation_year !== 'number' || !Number.isFinite(graduation_year))
    ) return false;

    for (const { from, to, role, company, summary, tags } of experience) {
        if (
            (typeof from !== 'string' || !isValidYYYYMM(from)) ||
            (to !== undefined && (typeof to !== 'string' || !isValidYYYYMM(to))) ||
            (typeof role !== 'string' || role.trim() === '') ||
            (typeof company !== 'string' || company.trim() === '') ||
            (typeof summary !== 'string' || summary.trim() === '') ||
            (!Array.isArray(tags) || tags.length === 0)
        ) return false;
        for (const tag of tags) if (typeof tag !== 'string' || tag.trim() === '') return false;
    }

    for (const { name, category, level, years } of skills) if (
        (typeof name !== 'string' || name.trim() === '') ||
        (typeof category !== 'string' || category.trim() === '') ||
        (typeof level !== 'string' || level.trim() === '') ||
        (typeof years !== 'number' || !Number.isFinite(years))
    ) return false;

    return true;
}

async function upsertArtifact(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
    parseBody: () => Promise<ArtifactRequestBody>
) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) {
        return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });
    }

    const origin = req.headers.get('origin') || undefined;

    let body: ArtifactRequestBody;
    try {
        body = await parseBody();
    } catch {
        return jsonError(400, 'InvalidRequestBody', 'Request body must be valid JSON', origin);
    }

    const { type: artifactType } = body;

    if (!(typeof artifactType === 'string' && JOB_ARTIFACT_TYPES.includes(artifactType as JobArtifactType))) {
        return jsonError(422, InvalidArtifactTypeError.name, `Artifact type must be one of: ${JOB_ARTIFACT_TYPES.join(', ')}`, origin);
    }

    // Type-specific validation
    if (artifactType === 'cv') {
        if (!validateCvContent(body.content)) {
            return jsonError(400, 'InvalidCvContent',
                'CV content must be a valid CvModel object with required fields: templateId, header (name/email/phone/location non-empty), slots.skills (non-empty, with non-empty name/category/level and numeric years), slots.experience (non-empty, with YYYY-MM dates and non-empty tags), slots.education (may be empty)',
                origin);
        }
    } else if (artifactType === 'cover-letter') {
        if (typeof body.content !== 'string') {
            return jsonError(422, 'InvalidContent', 'Cover letter content must be a string', origin);
        }
    }

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });

    const { id } = await params;

    const job = await db.collection<Job>('jobs').findOne(
        { id },
        { projection: { _id: 0, id: 1, artifacts: 1 } }
    );

    if (!job) {
        return jsonError(404, JobNotFoundError.name, `Job ${id} not found`, origin);
    }

    const now = new Date();
    const existingArtifact = job.artifacts?.find(a => a.type === artifactType);

    let artifact: JobArtifact;
    if (artifactType === 'cv') {
        artifact = {
            type: 'cv',
            content: body.content,
            createdAt: existingArtifact?.createdAt ?? now,
            updatedAt: now
        };
    } else {
        const coverLetterBody = body as CoverLetterRequestBody;
        artifact = {
            type: 'cover-letter',
            content: coverLetterBody.content,
            ...(coverLetterBody.subject !== undefined && { subject: coverLetterBody.subject }),
            ...(coverLetterBody.recipient !== undefined && { recipient: coverLetterBody.recipient }),
            ...(coverLetterBody.applicant !== undefined && { applicant: coverLetterBody.applicant }),
            createdAt: existingArtifact?.createdAt ?? now,
            updatedAt: now
        };
    }

    if (existingArtifact) {
        // Update existing artifact using array filters
        await db.collection<Job>('jobs').updateOne(
            { id },
            {
                $set: {
                    'artifacts.$[elem]': artifact
                }
            },
            {
                arrayFilters: [{ 'elem.type': artifactType }]
            }
        );
    } else {
        // Push new artifact to array (or initialize array if it doesn't exist)
        await db.collection<Job>('jobs').updateOne(
            { id },
            {
                $push: {
                    artifacts: artifact
                }
            }
        );
    }

    return NextResponse.json({ artifact }, { headers: corsHeaders(origin) });
}

// PUT handler for normal fetch calls with application/json
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return upsertArtifact(req, context, () => req.json());
}

// POST handler to support navigator.sendBeacon, which sends string payloads as
// "text/plain;charset=UTF-8" by default. We read the body as text and parse JSON
// here as a compatibility workaround, not as a general text/plain API contract.
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return upsertArtifact(req, context, async () => JSON.parse(await req.text()));
}
