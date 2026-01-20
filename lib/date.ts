import { makeUtcMonthYear } from "./utils";

/**
 * Parse result for month dates with potential error message
 */
type ParsedMonthDate = {
    value: Date | null;
    error?: string;
};/**
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

