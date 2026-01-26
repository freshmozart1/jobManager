import { PersonalInformationCareerGoal, PersonalInformationCertification, PersonalInformationEducation, PersonalInformationExperience, PersonalInformationLanguageSpoken, PersonalInformationMotivation } from "@/types";
import { makeUtcMonthYear, formatMonthYear } from "./utils";
import { parseMonthDate, toCanonicalMonthIso } from "./date";

type UnknownRecord = Record<string, unknown>;

function trimmedString(source: UnknownRecord, key: string): string {
    const value = source[key];
    return typeof value === "string" ? value.trim() : "";
}

function normaliseArray<T>(value: unknown, mapFn: (source: UnknownRecord) => T | null): T[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            const source = typeof entry === "object" && entry !== null ? (entry as UnknownRecord) : null;
            if (!source) return null;
            return mapFn(source);
        })
        .filter((item): item is T => item !== null);
}

function normaliseCareerGoalsAndMotivations(value: unknown) {
    return normaliseArray(value, (source) => {
        const topic = trimmedString(source, "topic");
        const description = trimmedString(source, "description");

        if (!topic || !description) return null;

        return {
            topic,
            description,
            reason_lite: "",
        };
    });
}

function normaliseSkills(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    const seen = new Set<string>();
    const normalised: string[] = [];
    for (const value of input) {
        if (typeof value !== "string") continue;
        const trimmed = value.trim();
        if (!trimmed || seen.has(trimmed)) continue;
        seen.add(trimmed);
        normalised.push(trimmed);
    }
    return normalised;
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
    return normaliseArray(value, (source) => {
        const from = ensureDate(source.from);
        if (!from) return null;
        const to = ensureDate(source.to);
        const role = trimmedString(source, "role");
        const company = trimmedString(source, "company");
        const summary = trimmedString(source, "summary");
        const skills = normaliseSkills(source.skills);
        if (!role || !company || !summary) return null;
        const normalised: PersonalInformationExperience = {
            from,
            role,
            company,
            summary,
            skills,
        };
        if (to) {
            normalised.to = to;
        }
        return normalised;
    });
}


export function normaliseCertifications(value: unknown): PersonalInformationCertification[] {
    return normaliseArray(value, (source) => {
        const name = trimmedString(source, "name");
        if (!name) return null;

        // Parse issued date (required)
        const issuedParsed = parseMonthDate(source.issued);
        if (!issuedParsed.value) {
            console.warn(`Skipping certification "${name}": invalid issued date`, issuedParsed.error);
            return null;
        }

        // Parse expires date (optional)
        const expiresParsed = parseMonthDate(source.expires);
        if (expiresParsed.error && source.expires !== null && source.expires !== undefined && source.expires !== "") {
            console.warn(`Certification "${name}": invalid expires date`, expiresParsed.error);
        }

        return {
            name,
            issued: issuedParsed.value,
            expires: expiresParsed.value,
        };
    });
}

export function normaliseEducationItems(value: unknown): PersonalInformationEducation[] {
    return normaliseArray(value, (source) => {
        const degree = trimmedString(source, "degree");
        const field = trimmedString(source, "field");
        const institution = trimmedString(source, "institution");
        const graduation_year = Number(source.graduation_year);

        if (!degree || !field || !institution || !Number.isFinite(graduation_year)) return null;

        return {
            degree,
            field,
            institution,
            graduation_year,
        };
    });
}


export function normaliseLanguages(value: unknown): PersonalInformationLanguageSpoken[] {
    return normaliseArray(value, (source) => {
        const language = trimmedString(source, "language");
        const level = trimmedString(source, "level");

        if (!language || !level) return null;

        return {
            language,
            level,
        };
    });
}

export function normaliseMotivations(value: unknown): PersonalInformationMotivation[] {
    return normaliseCareerGoalsAndMotivations(value);
}

export function normaliseCareerGoals(value: unknown): PersonalInformationCareerGoal[] {
    return normaliseCareerGoalsAndMotivations(value);
}

export function serializeExperienceItems(
    items: PersonalInformationExperience[]
): {
    from: string;
    to?: string;
    role: string;
    company: string;
    summary: string;
    skills: string[];
}[] {
    return items.map((item: PersonalInformationExperience) => ({
        from: formatMonthYear(item.from),
        to: item.to ? formatMonthYear(item.to) : undefined,
        role: item.role.trim(),
        company: item.company.trim(),
        summary: item.summary.trim(),
        skills: normaliseSkills(item.skills),
    }));
}

/**
 * Serialize certifications to canonical month ISO strings for persistence
 */
export function serializeCertifications(
    items: PersonalInformationCertification[]
): {
    name: string;
    issued: string;
    expires: string | null;
}[] {
    return items.map((item) => ({
        name: item.name.trim(),
        issued: toCanonicalMonthIso(item.issued)!,
        expires: toCanonicalMonthIso(item.expires),
    }));
}
