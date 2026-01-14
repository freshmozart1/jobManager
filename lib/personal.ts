import { PersonalInformationCareerGoal, PersonalInformationCertification, PersonalInformationEducation, PersonalInformationExperience, PersonalInformationLanguageSpoken, PersonalInformationMotivation, PersonalInformationSkill } from "@/types";
import { makeUtcMonthYear, normaliseTags, formatMonthYear } from "./utils";

/**
 * Parse result for month dates with potential error message
 */
export type ParsedMonthDate = {
    value: Date | null;
    error?: string;
};

/**
 * Parse a month date input (Date, ISO string, or YYYY-MM) into a UTC month-start Date
 * Accepts:
 * - Date objects
 * - ISO strings (any valid ISO date)
 * - YYYY-MM strings
 * - null/undefined -> null
 * Returns: { value: Date | null, error?: string }
 */
export function parseMonthDate(input: unknown): ParsedMonthDate {
    if (!input || input === null || input === undefined || input === '') {
        return { value: null };
    }

    if (input instanceof Date) {
        if (Number.isNaN(input.getTime())) {
            return { value: null, error: 'Invalid date' };
        }
        // Normalize to month start
        return { value: makeUtcMonthYear(input.getFullYear(), input.getMonth()) };
    }

    if (typeof input === 'string') {
        const trimmed = input.trim();

        // Try YYYY-MM format first
        if (/^\d{4}-\d{2}$/.test(trimmed)) {
            const [yearStr, monthStr] = trimmed.split("-");
            const year = Number(yearStr);
            const month = Number(monthStr);

            if (!Number.isFinite(year) || !Number.isFinite(month)) {
                return { value: null, error: `Invalid YYYY-MM format: ${trimmed}` };
            }

            if (month < 1 || month > 12) {
                return { value: null, error: `Month must be between 1-12, got: ${month}` };
            }

            return { value: makeUtcMonthYear(year, month - 1) };
        }

        // Try ISO date string
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            return { value: makeUtcMonthYear(parsed.getFullYear(), parsed.getMonth()) };
        }

        return { value: null, error: `Cannot parse date: ${trimmed}` };
    }

    if (typeof input === 'number') {
        const parsed = new Date(input);
        if (!Number.isNaN(parsed.getTime())) {
            return { value: makeUtcMonthYear(parsed.getFullYear(), parsed.getMonth()) };
        }
        return { value: null, error: `Invalid timestamp: ${input}` };
    }

    return { value: null, error: `Unsupported date type: ${typeof input}` };
}

/**
 * Convert a Date to canonical month ISO string (YYYY-MM-01T00:00:00.000Z)
 * Used for persistence to ensure consistent storage format
 */
export function toCanonicalMonthIso(date: Date | null): string | null {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
        return null;
    }
    const normalized = makeUtcMonthYear(date.getFullYear(), date.getMonth());
    return normalized.toISOString();
}

/**
 * Convert a Date to YYYY-MM format for CV artifacts
 * Maintains backward compatibility with existing CV string contracts
 */
export function toCvMonthString(date: Date | null): string | null {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
        return null;
    }
    return formatMonthYear(date);
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

            if (!name) return null;

            // Parse issued date (required)
            const issuedParsed = parseMonthDate(source.issued);
            if (!issuedParsed.value) {
                console.warn(`Skipping certification "${name}": invalid issued date`, issuedParsed.error);
                return null;
            }

            // Parse expires date (optional)
            const expiresParsed = parseMonthDate(source.expires);
            if (expiresParsed.error && source.expires !== null && source.expires !== undefined && source.expires !== '') {
                console.warn(`Certification "${name}": invalid expires date`, expiresParsed.error);
            }

            return {
                name,
                issued: issuedParsed.value,
                expires: expiresParsed.value,
            };
        })
        .filter((item): item is PersonalInformationCertification => item !== null);
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