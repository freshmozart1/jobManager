import { corsHeaders } from "@/lib/cors";
import { NoDatabaseNameError, InvalidPersonalInformationTypeError, MissingPersonalInformationFieldsError, PersonalInformationDocumentNotFoundError, NoPersonalInformationCareerGoalsError, NoPersonalInformationCertificationsError, NoPersonalInformationConstraintsError, NoPersonalInformationContactError, NoPersonalInformationEducationError, NoPersonalInformationEligibilityError, NoPersonalInformationExclusionsError, NoPersonalInformationExperienceError, NoPersonalInformationLanguageSpokenError, NoPersonalInformationMotivationsError, NoPersonalInformationPreferencesError, NoPersonalInformationSkillsError } from "@/lib/errors";
import mongoPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { PersonalInformation, PersonalInformationCareerGoal, PersonalInformationCertification, PersonalInformationConstraints, PersonalInformationContact, PersonalInformationEducation, PersonalInformationEligibility, PersonalInformationExclusions, PersonalInformationExperience, PersonalInformationLanguageSpoken, PersonalInformationMotivation, PersonalInformationPreferences, PersonalInformationSkill } from "@/types";
import { VALID_PERSONAL_INFORMATION_TYPES } from "@/lib/constants";
import { Db, ObjectId } from "mongodb";


type PersonalInformationDocument = {
    _id: ObjectId;
    type: string;
    value: PersonalInformationContact | PersonalInformationEligibility | PersonalInformationConstraints | PersonalInformationPreferences | PersonalInformationSkill[] | PersonalInformationExperience[] | PersonalInformationEducation[] | PersonalInformationCertification[] | PersonalInformationLanguageSpoken[] | PersonalInformationExclusions | PersonalInformationMotivation[] | PersonalInformationCareerGoal[];
}

async function init() {
    const { DATABASE_NAME } = process.env;
    if (!DATABASE_NAME) throw new NoDatabaseNameError();
    const db = (await mongoPromise).db(DATABASE_NAME);
    await db.command({ ping: 1 }, { timeoutMS: 3000 });
    return db;
};

async function fetchPersonalInformation(db: Db): Promise<PersonalInformation> {
    return Object.fromEntries(await Promise.all([
        ['contact', NoPersonalInformationContactError.name],
        ['eligibility', NoPersonalInformationEligibilityError.name],
        ['constraints', NoPersonalInformationConstraintsError.name],
        ['preferences', NoPersonalInformationPreferencesError.name],
        ['skills', NoPersonalInformationSkillsError.name],
        ['experience', NoPersonalInformationExperienceError.name],
        ['education', NoPersonalInformationEducationError.name],
        ['certifications', NoPersonalInformationCertificationsError.name],
        ['languages_spoken', NoPersonalInformationLanguageSpokenError.name],
        ['exclusions', NoPersonalInformationExclusionsError.name],
        ['motivations', NoPersonalInformationMotivationsError.name],
        ['career_goals', NoPersonalInformationCareerGoalsError.name]
    ].map(async ([key, errName]) => {
        const doc = await db.collection<PersonalInformationDocument>("personalInformation")
            .findOne({ type: key });
        if (!doc) throw { status: 400, statusText: errName };
        return [key, doc.value];
    }))) as PersonalInformation;
}

export function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET() {
    return NextResponse.json(await fetchPersonalInformation(await init()), { headers: corsHeaders() });
}

export async function PUT(req: NextRequest) {
    const db = await init();
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

    if (!updatedDoc) {
        return NextResponse.json(
            {},
            { status: 404, statusText: PersonalInformationDocumentNotFoundError.name, headers: corsHeaders(origin) }
        );
    }

    return NextResponse.json(updatedDoc, { headers: corsHeaders(origin) });
}

