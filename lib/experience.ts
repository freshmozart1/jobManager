import { PersonalInformationExperienceItem } from "@/types";
import { formatMonthYear, makeUtcMonthYear } from "@/lib/utils";

export type ExperiencePayloadItem = {
    from: string;
    to?: string;
    role: string;
    company: string;
    summary: string;
    tags: string[];
};

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
            const tags = Array.isArray(source.tags)
                ? source.tags
                    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
                    .filter((tag, index, array) => tag.length > 0 && array.indexOf(tag) === index)
                : [];
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

export function serializeExperienceItems(items: PersonalInformationExperienceItem[]): ExperiencePayloadItem[] {
    return items.map((item) => ({
        from: formatMonthYear(item.from),
        to: item.to ? formatMonthYear(item.to) : undefined,
        role: item.role.trim(),
        company: item.company.trim(),
        summary: item.summary.trim(),
        tags: Array.isArray(item.tags) ? item.tags.map((tag) => tag.trim()).filter(Boolean) : [],
    }));
}

function compareMonthsDesc(a?: Date, b?: Date): number {
    const aTime = a ? a.getTime() : Number.NEGATIVE_INFINITY;
    const bTime = b ? b.getTime() : Number.NEGATIVE_INFINITY;
    return bTime - aTime;
}

function compareOptionalMonthsDesc(a?: Date, b?: Date): number {
    const aTime = a ? a.getTime() : Number.POSITIVE_INFINITY;
    const bTime = b ? b.getTime() : Number.POSITIVE_INFINITY;
    return bTime - aTime;
}

export function sortExperienceItems(items: PersonalInformationExperienceItem[]): PersonalInformationExperienceItem[] {
    return [...items].sort((a, b) => {
        const fromDiff = compareMonthsDesc(a.from, b.from);
        if (fromDiff !== 0) return fromDiff;
        const toDiff = compareOptionalMonthsDesc(a.to, b.to);
        if (toDiff !== 0) return toDiff;
        return a.role.localeCompare(b.role);
    });
}

export function experienceItemsEqual(a: PersonalInformationExperienceItem, b: PersonalInformationExperienceItem): boolean {
    const fromA = a.from instanceof Date ? a.from.getTime() : new Date(a.from).getTime();
    const fromB = b.from instanceof Date ? b.from.getTime() : new Date(b.from).getTime();
    const toA = a.to ? (a.to instanceof Date ? a.to.getTime() : new Date(a.to).getTime()) : null;
    const toB = b.to ? (b.to instanceof Date ? b.to.getTime() : new Date(b.to).getTime()) : null;
    return (
        fromA === fromB &&
        toA === toB &&
        a.role === b.role &&
        a.company === b.company &&
        a.summary === b.summary &&
        a.tags.join("|") === b.tags.join("|")
    );
}
