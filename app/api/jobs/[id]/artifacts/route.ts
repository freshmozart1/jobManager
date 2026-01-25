import { jsonError } from "@/lib/api";
import { JOB_ARTIFACT_TYPES } from "@/lib/constants";
import { corsHeaders } from "@/lib/cors";
import { InvalidArtifactTypeError, JobNotFoundError, NoDatabaseNameError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { Job, JobArtifact, JobArtifactType } from "@/types";
import { CvModel, isValidYYYYMM } from "@/lib/cvModel";
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
 * Check if a string is blank (empty or whitespace-only)
 */
function isBlank(value: unknown): boolean {
    return typeof value === 'string' && value.trim() === '';
}

/**
 * Validate CV artifact structure.
 * Only templateId is required. All other fields are optional and validated only if present.
 * Blank strings are treated as absent (not validated).
 */
function validateCvContent(content: unknown): boolean {
    if (typeof content !== 'object' || content === null) {
        return false;
    }

    const cv = content as CvModel;

    // Only templateId is required
    if (!cv.templateId || typeof cv.templateId !== 'string') {
        return false;
    }

    // Header validation (optional, validate if present)
    if (cv.header !== undefined) {
        if (typeof cv.header !== 'object' || cv.header === null) {
            return false;
        }

        // Name, email, phone: if present and non-blank, must be valid strings
        if (cv.header.name !== undefined && (typeof cv.header.name !== 'string' || isBlank(cv.header.name))) {
            return false;
        }
        if (cv.header.email !== undefined && (typeof cv.header.email !== 'string' || isBlank(cv.header.email))) {
            return false;
        }
        if (cv.header.phone !== undefined && (typeof cv.header.phone !== 'string' || isBlank(cv.header.phone))) {
            return false;
        }

        // Address: if present, validate structure
        if (cv.header.address !== undefined) {
            if (typeof cv.header.address !== 'object' || cv.header.address === null) {
                return false;
            }

            const { streetAddress, addressLocality, addressRegion, postalCode, addressCountry } = cv.header.address;

            if (streetAddress !== undefined && (typeof streetAddress !== 'string' || isBlank(streetAddress))) {
                return false;
            }
            if (addressLocality !== undefined && (typeof addressLocality !== 'string' || isBlank(addressLocality))) {
                return false;
            }
            if (addressRegion !== undefined && (typeof addressRegion !== 'string' || isBlank(addressRegion))) {
                return false;
            }
            if (postalCode !== undefined && (typeof postalCode !== 'string' || isBlank(postalCode))) {
                return false;
            }
            if (addressCountry !== undefined && (typeof addressCountry !== 'string' || isBlank(addressCountry))) {
                return false;
            }
        }
    }

    // Slots validation (optional, validate if present)
    if (cv.slots !== undefined) {
        if (typeof cv.slots !== 'object' || cv.slots === null) {
            return false;
        }

        // Education: if present, must be array; validate items if present
        if (cv.slots.education !== undefined) {
            if (!Array.isArray(cv.slots.education)) {
                return false;
            }
            for (const item of cv.slots.education) {
                if (item.degree !== undefined && (typeof item.degree !== 'string' || isBlank(item.degree))) {
                    return false;
                }
                if (item.field !== undefined && (typeof item.field !== 'string' || isBlank(item.field))) {
                    return false;
                }
                if (item.institution !== undefined && (typeof item.institution !== 'string' || isBlank(item.institution))) {
                    return false;
                }
                if (item.graduation_year !== undefined && (typeof item.graduation_year !== 'number' || !Number.isFinite(item.graduation_year))) {
                    return false;
                }
            }
        }

        // Experience: if present, must be array; validate items if present
        if (cv.slots.experience !== undefined) {
            if (!Array.isArray(cv.slots.experience)) {
                return false;
            }
            for (const item of cv.slots.experience) {
                if (item.from !== undefined && (typeof item.from !== 'string' || !isValidYYYYMM(item.from))) {
                    return false;
                }
                if (item.to !== undefined && (typeof item.to !== 'string' || !isValidYYYYMM(item.to))) {
                    return false;
                }
                if (item.role !== undefined && (typeof item.role !== 'string' || isBlank(item.role))) {
                    return false;
                }
                if (item.company !== undefined && (typeof item.company !== 'string' || isBlank(item.company))) {
                    return false;
                }
                if (item.summary !== undefined && (typeof item.summary !== 'string' || isBlank(item.summary))) {
                    return false;
                }
                if (item.skills !== undefined) {
                    if (!Array.isArray(item.skills)) {
                        return false;
                    }
                    for (const tag of item.skills) {
                        if (typeof tag !== 'string' || isBlank(tag)) {
                            return false;
                        }
                    }
                }
            }
        }


        // Certifications: if present, must be array; validate items if present
        if (cv.slots.certifications !== undefined) {
            if (!Array.isArray(cv.slots.certifications)) {
                return false;
            }
            for (const item of cv.slots.certifications) {
                if (item.name !== undefined && (typeof item.name !== 'string' || isBlank(item.name))) {
                    return false;
                }
                if (item.issued !== undefined && typeof item.issued !== 'string') {
                    return false;
                }
                if (item.expires !== undefined && item.expires !== null && typeof item.expires !== 'string') {
                    return false;
                }
            }
        }
    }

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
                'CV content must be a valid CvModel object. Required: templateId (string). Optional: header, header.address, slots (education/experience/certifications arrays). Blank strings are treated as absent. When present, fields must have valid types: experience dates must be YYYY-MM format, certification issued/expires dates must be YYYY-MM format (expires can be null), numeric fields must be finite numbers.',
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
