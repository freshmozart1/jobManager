import { PersonalInformation, PersonalInformationCareerGoal, PersonalInformationCertification, PersonalInformationDocument, PersonalInformationEducation, PersonalInformationExperience, PersonalInformationLanguageSpoken, PersonalInformationMotivation, PersonalInformationSkill } from "@/types";
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

export function normaliseExperienceItems(value: unknown): PersonalInformationExperience[] {
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
            const normalised: PersonalInformationExperience = {
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
        .filter((item): item is PersonalInformationExperience => item !== null);
}

export function serializeExperienceItems(
    items: PersonalInformationExperience[]
): {
    from: string;
    to?: string;
    role: string;
    company: string;
    summary: string;
    tags: string[];
}[] {
    return items.map((item: PersonalInformationExperience) => ({
        from: formatMonthYear(item.from),
        to: item.to ? formatMonthYear(item.to) : undefined,
        role: item.role.trim(),
        company: item.company.trim(),
        summary: item.summary.trim(),
        tags: normaliseTags(item.tags),
    }));
}

export function normaliseSkills(value: unknown): PersonalInformationSkill[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null) return null;
            const source = entry as Record<string, unknown>;
            const name = typeof source.name === "string" ? source.name.trim() : "";
            const category = typeof source.category === "string" ? source.category.trim() : "";
            const level = typeof source.level === "string" ? source.level.trim() : "";
            const years = typeof source.years === "number" ? source.years : Number(source.years);
            const last_used = typeof source.last_used === "string" ? source.last_used : "";
            const aliasesRaw = Array.isArray(source.aliases) ? source.aliases : [];
            const aliases = aliasesRaw
                .filter((a): a is string => typeof a === "string")
                .map((a) => a.trim())
                .filter(Boolean);
            const primary = Boolean(source.primary);

            if (!name) return null;
            return {
                name,
                aliases,
                category,
                level,
                years: Number.isFinite(years) ? years : 0,
                last_used,
                primary,
            } satisfies PersonalInformationSkill;
        })
        .filter((item): item is PersonalInformationSkill => item !== null);
}
export function normaliseEducationItems(value: unknown): PersonalInformationEducation[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null) return null;
            const source = entry as Record<string, unknown>;
            const degree = typeof source.degree === "string" ? source.degree.trim() : "";
            const field = typeof source.field === "string" ? source.field.trim() : "";
            const institution = typeof source.institution === "string" ? source.institution.trim() : "";
            const graduation_year = Number(source.graduation_year);

            if (!degree || !field || !institution || !Number.isFinite(graduation_year)) return null;

            return {
                degree,
                field,
                institution,
                graduation_year,
            };
        })
        .filter((item): item is PersonalInformationEducation => item !== null);
}

export function normaliseCertifications(value: unknown): PersonalInformationCertification[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null) return null;
            const source = entry as Record<string, unknown>;
            const name = typeof source.name === "string" ? source.name.trim() : "";
            const issued = typeof source.issued === "string" ? source.issued.trim() : "";
            const expires = typeof source.expires === "string" ? source.expires.trim() : null;

            if (!name || !issued) return null;

            return {
                name,
                issued,
                expires,
            };
        })
        .filter((item): item is PersonalInformationCertification => item !== null);
}

export function normaliseLanguages(value: unknown): PersonalInformationLanguageSpoken[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null) return null;
            const source = entry as Record<string, unknown>;
            const language = typeof source.language === "string" ? source.language.trim() : "";
            const level = typeof source.level === "string" ? source.level.trim() : "";

            if (!language || !level) return null;

            return {
                language,
                level,
            };
        })
        .filter((item): item is PersonalInformationLanguageSpoken => item !== null);
}

export function normaliseMotivations(value: unknown): PersonalInformationMotivation[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null) return null;
            const source = entry as Record<string, unknown>;
            const topic = typeof source.topic === "string" ? source.topic.trim() : "";
            const description = typeof source.description === "string" ? source.description.trim() : "";

            if (!topic || !description) return null;

            return {
                topic,
                description,
                reason_lite: "",
            };
        })
        .filter((item): item is PersonalInformationMotivation => item !== null);
}

export function normaliseCareerGoals(value: unknown): PersonalInformationCareerGoal[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (typeof entry !== "object" || entry === null) return null;
            const source = entry as Record<string, unknown>;
            const topic = typeof source.topic === "string" ? source.topic.trim() : "";
            const description = typeof source.description === "string" ? source.description.trim() : "";

            if (!topic || !description) return null;

            return {
                topic,
                description,
                reason_lite: "",
            };
        })
        .filter((item): item is PersonalInformationCareerGoal => item !== null);
}