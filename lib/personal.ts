import { PersonalInformation, PersonalInformationDocument, PersonalInformationExperienceItem } from "@/types";
import { Db } from "mongodb";
import { NoPersonalInformationContactError, NoPersonalInformationEligibilityError, NoPersonalInformationConstraintsError, NoPersonalInformationPreferencesError, NoPersonalInformationSkillsError, NoPersonalInformationExperienceError, NoPersonalInformationEducationError, NoPersonalInformationCertificationsError, NoPersonalInformationLanguageSpokenError, NoPersonalInformationExclusionsError, NoPersonalInformationMotivationsError, NoPersonalInformationCareerGoalsError } from "./errors";
import { makeUtcMonthYear, normaliseTags, formatMonthYear } from "./utils";


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

function ensureDate(input: unknown): Date | undefined {
    if (!input) return undefined;
    if (input instanceof Date) {
        return new Date(input.getTime());
    }
    if (typeof input === "string") {
        if (/^\d{4}-\d{2}$/.test(input)) {
            const [yearStr, monthStr] = input.split("-");
            const year = Number(yearStr);
            const month = Number(monthStr);
            if (!Number.isFinite(year) || !Number.isFinite(month)) return undefined;
            return makeUtcMonthYear(year, month - 1);
        }
        const parsed = new Date(input);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    if (typeof input === "number") {
        const parsed = new Date(input);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    return undefined;
}

export function normaliseExperienceItems(value: unknown): PersonalInformationExperienceItem[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null) return null;
            const source = entry as Record<string, unknown>;
            const from = ensureDate(source.from);
            if (!from) return null;
            const to = ensureDate(source.to);
            const role = typeof source.role === "string" ? source.role.trim() : "";
            const company = typeof source.company === "string" ? source.company.trim() : "";
            const summary = typeof source.summary === "string" ? source.summary.trim() : "";
            const tags = normaliseTags(source.tags);
            if (!role || !company || !summary) return null;
            const normalised: PersonalInformationExperienceItem = {
                from,
                role,
                company,
                summary,
                tags,
            };
            if (to) {
                normalised.to = to;
            }
            return normalised;
        })
        .filter((item): item is PersonalInformationExperienceItem => item !== null);
}

export function serializeExperienceItems(
    items: PersonalInformationExperienceItem[]
): {
    from: string;
    to?: string;
    role: string;
    company: string;
    summary: string;
    tags: string[];
}[] {
    return items.map((item: PersonalInformationExperienceItem) => ({
        from: formatMonthYear(item.from),
        to: item.to ? formatMonthYear(item.to) : undefined,
        role: item.role.trim(),
        company: item.company.trim(),
        summary: item.summary.trim(),
        tags: normaliseTags(item.tags),
    }));
}
