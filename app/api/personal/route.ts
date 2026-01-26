import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError, InvalidPersonalInformationTypeError, MissingPersonalInformationFieldsError, PersonalInformationDocumentNotFoundError, NoPersonalInformationCareerGoalsError, NoPersonalInformationCertificationsError, NoPersonalInformationConstraintsError, NoPersonalInformationContactError, NoPersonalInformationEducationError, NoPersonalInformationEligibilityError, NoPersonalInformationExclusionsError, NoPersonalInformationExperienceError, NoPersonalInformationLanguageSpokenError, NoPersonalInformationMotivationsError, NoPersonalInformationPreferencesError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { PersonalInformationCareerGoal, PersonalInformationCertification, PersonalInformationConstraints, PersonalInformationContact, PersonalInformationEducation, PersonalInformationEligibility, PersonalInformationExclusions, PersonalInformationExperience, PersonalInformationLanguageSpoken, PersonalInformationMotivation, PersonalInformationPreferences } from "@/types";
import { VALID_PERSONAL_INFORMATION_TYPES } from "@/lib/constants";
import { Db, ObjectId } from "mongodb";


type PersonalInformationDocument = {
    _id: ObjectId;
    type: string;
    value: PersonalInformationContact | PersonalInformationEligibility | PersonalInformationConstraints | PersonalInformationPreferences | PersonalInformationExperience[] | PersonalInformationEducation[] | PersonalInformationCertification[] | PersonalInformationLanguageSpoken[] | PersonalInformationExclusions | PersonalInformationMotivation[] | PersonalInformationCareerGoal[];
}

async function init(databaseName: string | undefined): Promise<Db> {
    if (!databaseName) throw new NoDatabaseNameError();
    const db = (await mongoPromise).db(databaseName);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    return db;
};

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
    return NextResponse.json(Object.fromEntries(await Promise.all([
        ['contact', NoPersonalInformationContactError.name],
        ['eligibility', NoPersonalInformationEligibilityError.name],
        ['constraints', NoPersonalInformationConstraintsError.name],
        ['preferences', NoPersonalInformationPreferencesError.name],
        ['experience', NoPersonalInformationExperienceError.name],
        ['education', NoPersonalInformationEducationError.name],
        ['certifications', NoPersonalInformationCertificationsError.name],
        ['languages_spoken', NoPersonalInformationLanguageSpokenError.name],
        ['exclusions', NoPersonalInformationExclusionsError.name],
        ['motivations', NoPersonalInformationMotivationsError.name],
        ['career_goals', NoPersonalInformationCareerGoalsError.name]
    ].map(async ([key, errName]) => {
        const doc = await init(req.headers.get('x-test-db') || process.env.DATABASE_NAME).then((db: Db) => db.collection<PersonalInformationDocument>('personalInformation').findOne({ type: key }));
        if (!doc) throw { status: 400, statusText: errName };
        return [key, doc.value];
    }))), { headers: corsHeaders() });
}

export async function PUT(req: NextRequest) {
    const origin = req.headers.get('origin') || undefined;
    const { type, value } = await req.json();
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
    const updatedDoc = await init(req.headers.get('x-test-db') || process.env.DATABASE_NAME).then((db: Db) => {
        return db.collection<PersonalInformationDocument>('personalInformation').findOneAndUpdate(
            { type },
            { $set: { value } },
            { returnDocument: 'after', projection: { _id: 0 }, upsert: true }
        );
    });
    if (!updatedDoc?.value) return NextResponse.json({}, { status: 404, statusText: PersonalInformationDocumentNotFoundError.name, headers: corsHeaders(origin) });
    return NextResponse.json(updatedDoc, { headers: corsHeaders(origin) });
}

