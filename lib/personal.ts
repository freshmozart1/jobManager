import { PersonalInformationCareerGoal, PersonalInformationCertification, PersonalInformationEducation, PersonalInformationExperience, PersonalInformationLanguageSpoken, PersonalInformationMotivation, PersonalInformationSkill } from "@/types";
import { makeUtcMonthYear, formatMonthYear } from "./utils";

type UnknownRecord = Record<string, unknown>;

/**
 * Parse result for month dates with potential error message
 */
export type ParsedMonthDate = {
    value: Date | null;
    error?: string;
};


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

export function normaliseExperienceItems(value: unknown): PersonalInformationExperience[] {
    return normaliseArray(value, (source) => {
        const from = ensureDate(source.from);
        if (!from) return null;
        const to = ensureDate(source.to);
        const role = trimmedString(source, "role");
        const company = trimmedString(source, "company");
        const summary = trimmedString(source, "summary");
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

export function normaliseSkills(value: unknown): PersonalInformationSkill[] {
    return normaliseArray(value, (source) => {
        const name = trimmedString(source, "name");
        const years = typeof source.years === "number" ? source.years : Number(source.years);

        // Parse last_used date (required)
        const lastUsedParsed = parseMonthDate(source.last_used);
        if (!lastUsedParsed.value) throw new Error(`Invalid last_used date for skill "${name}": ${lastUsedParsed.error}`);

        if (!name) return null;
        return {
            name,
            aliases: Array.isArray(source.aliases)
                ? source.aliases
                    .filter((a): a is string => typeof a === "string")
                    .map((a) => a.trim())
                    .filter(Boolean)
                : [],
            category: trimmedString(source, "category"),
            level: trimmedString(source, "level"),
            years: Number.isFinite(years) ? years : 0,
            last_used: lastUsedParsed.value,
            primary: Boolean(source.primary),
        } satisfies PersonalInformationSkill;
    });
}

/**
 * Serialize skills to canonical month ISO strings for persistence
 */
export function serializeSkills(
    items: PersonalInformationSkill[]
): {
    name: string;
    aliases: string[];
    category: string;
    level: string;
    years: number;
    last_used: string;
    primary: boolean;
}[] {
    return items.map((item) => ({
        name: item.name.trim(),
        aliases: item.aliases,
        category: item.category.trim(),
        level: item.level.trim(),
        years: item.years,
        last_used: toCanonicalMonthIso(item.last_used)!,
        primary: item.primary,
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

export function normaliseCareerGoals(value: unknown): PersonalInformationCareerGoal[] {
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
function normaliseTags(input: unknown): string[] {
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
