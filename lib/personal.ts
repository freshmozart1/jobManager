import { PersonalInformation, PersonalInformationDocument } from "@/types";
import { Db } from "mongodb";
import { NoPersonalInformationContactError, NoPersonalInformationEligibilityError, NoPersonalInformationConstraintsError, NoPersonalInformationPreferencesError, NoPersonalInformationSkillsError, NoPersonalInformationExperienceError, NoPersonalInformationEducationError, NoPersonalInformationCertificationsError, NoPersonalInformationLanguageSpokenError, NoPersonalInformationExclusionsError, NoPersonalInformationMotivationsError, NoPersonalInformationCareerGoalsError } from "./errors";


// Map-based personal information fetch -> returns object directly
export async function fetchPersonalInformation(db: Db): Promise<PersonalInformation> {
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
