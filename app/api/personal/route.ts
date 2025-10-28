import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError, InvalidPersonalInformationTypeError, MissingPersonalInformationFieldsError, PersonalInformationDocumentNotFoundError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { fetchPersonalInformation } from "@/lib/personal";
import { NextRequest, NextResponse } from "next/server";
import { PersonalInformationDocument } from "@/types";

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

    const validTypes = [
        'contact', 'eligibility', 'constraints', 'preferences',
        'skills', 'experience', 'education', 'certifications',
        'languages_spoken', 'exclusions', 'motivations', 'career_goals'
    ];

    if (!type || value === undefined) {
        return NextResponse.json(
            {},
            { status: 400, statusText: MissingPersonalInformationFieldsError.name, headers: corsHeaders(origin) }
        );
    }

    if (!validTypes.includes(type)) {
        return NextResponse.json(
            {},
            { status: 400, statusText: InvalidPersonalInformationTypeError.name, headers: corsHeaders(origin) }
        );
    }

    const updateResult = await db.collection<PersonalInformationDocument>('personalInformation').updateOne(
        { type },
        {
            $set: {
                value
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

    return NextResponse.json(updatedDoc, { headers: corsHeaders(origin) });
}