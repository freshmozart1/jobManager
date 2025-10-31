import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError, InvalidPersonalInformationTypeError, MissingPersonalInformationFieldsError, PersonalInformationDocumentNotFoundError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { fetchPersonalInformation } from "@/lib/personal";
import { NextRequest, NextResponse } from "next/server";
import { PersonalInformationDocument } from "@/types";
import { VALID_PERSONAL_INFORMATION_TYPES } from "@/lib/constants";

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

export async function PUT(req: NextRequest) {
    const DATABASE_NAME = process.env.DATABASE_NAME;
    if (!DATABASE_NAME) return NextResponse.json({}, { status: 500, statusText: NoDatabaseNameError.name });

    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });

    const origin = req.headers.get('origin') || undefined;
    const body = await req.json();
    const { type, value } = body;

    if (!type || value === undefined) {
        return NextResponse.json(
            {},
            { status: 400, statusText: MissingPersonalInformationFieldsError.name, headers: corsHeaders(origin) }
        );
    }

    if (!VALID_PERSONAL_INFORMATION_TYPES.includes(type)) {
        return NextResponse.json(
            {},
            { status: 400, statusText: InvalidPersonalInformationTypeError.name, headers: corsHeaders(origin) }
        );
    }

    let sanitizedValue = value;

    if (type === 'experience') {
        if (!Array.isArray(value)) {
            return NextResponse.json(
                { error: 'Experience must be an array.' },
                { status: 400, headers: corsHeaders(origin) }
            );
        }

        const errors: string[] = [];
        const parsed = value.map((entry: unknown, index) => {
            if (typeof entry !== 'object' || entry === null) {
                errors.push(`Entry ${index + 1} is not an object.`);
                return null;
            }

            const { from, to, role, company, summary, tags } = entry as Record<string, unknown>;
            const normalizedToInput = typeof to === 'string' && to.trim().length === 0 ? undefined : to;

            const parseMonth = (input: unknown, field: 'from' | 'to') => {
                if (typeof input !== 'string') {
                    errors.push(`Entry ${index + 1} field "${field}" must be a YYYY-MM string.`);
                    return null;
                }

                if (!/^\d{4}-\d{2}$/.test(input)) {
                    errors.push(`Entry ${index + 1} field "${field}" must follow YYYY-MM format.`);
                    return null;
                }

                const [yearStr, monthStr] = input.split('-');
                const year = Number(yearStr);
                const month = Number(monthStr);

                if (month < 1 || month > 12) {
                    errors.push(`Entry ${index + 1} field "${field}" has invalid month.`);
                    return null;
                }

                const date = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
                if (Number.isNaN(date.getTime())) {
                    errors.push(`Entry ${index + 1} field "${field}" is not a valid date.`);
                    return null;
                }

                return date;
            };

            const parsedFrom = parseMonth(from, 'from');
            const parsedTo = normalizedToInput === undefined || normalizedToInput === null ? undefined : parseMonth(normalizedToInput, 'to');

            if (typeof role !== 'string' || role.trim().length === 0) {
                errors.push(`Entry ${index + 1} field "role" must be a non-empty string.`);
            }

            if (typeof company !== 'string' || company.trim().length === 0) {
                errors.push(`Entry ${index + 1} field "company" must be a non-empty string.`);
            }

            if (typeof summary !== 'string' || summary.trim().length === 0) {
                errors.push(`Entry ${index + 1} field "summary" must be a non-empty string.`);
            }

            let normalizedTags: string[] = [];
            if (tags !== undefined) {
                if (!Array.isArray(tags)) {
                    errors.push(`Entry ${index + 1} field "tags" must be an array of strings.`);
                } else {
                    normalizedTags = tags.map(tag => (typeof tag === 'string' ? tag.trim() : '')).filter(Boolean);
                }
            }

            if (normalizedTags.length > 10) {
                errors.push(`Entry ${index + 1} cannot contain more than 10 tags.`);
            }

            if (normalizedTags.some(tag => tag.length > 20)) {
                errors.push(`Entry ${index + 1} tags must be 20 characters or fewer.`);
            }

            if (parsedFrom && parsedTo && parsedTo.getTime() < parsedFrom.getTime()) {
                errors.push(`Entry ${index + 1} field "to" cannot be earlier than "from".`);
            }

            if (!parsedFrom) return null;

            return {
                from: parsedFrom,
                to: parsedTo,
                role: typeof role === 'string' ? role.trim() : '',
                company: typeof company === 'string' ? company.trim() : '',
                summary: typeof summary === 'string' ? summary.trim() : '',
                tags: normalizedTags
            };
        });

        if (errors.length > 0 || parsed.some(item => item === null)) {
            return NextResponse.json(
                { error: 'Invalid experience payload.', details: errors },
                { status: 400, headers: corsHeaders(origin) }
            );
        }

        sanitizedValue = parsed;
    }

    const updateResult = await db.collection<PersonalInformationDocument>('personalInformation').updateOne(
        { type },
        {
            $set: {
                value: sanitizedValue
            }
        }
    );

    if (updateResult.matchedCount === 0) {
        return NextResponse.json(
            {},
            { status: 404, statusText: PersonalInformationDocumentNotFoundError.name, headers: corsHeaders(origin) }
        );
    }

    const updatedDoc = await db.collection<PersonalInformationDocument>('personalInformation').findOne(
        { type },
        { projection: { _id: 0 } }
    );

    if (!updatedDoc) {
        return NextResponse.json(
            {},
            { status: 404, statusText: PersonalInformationDocumentNotFoundError.name, headers: corsHeaders(origin) }
        );
    }

    return NextResponse.json(updatedDoc, { headers: corsHeaders(origin) });
}