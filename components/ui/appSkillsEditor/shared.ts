export function normaliseName(value: string): string {
    return value.trim().toLowerCase();
}

export const NAME_TRUNCATE_AT = 12;
export const SEARCH_DEBOUNCE_MS = 150;
export const BANNER_TIMEOUT_MS = 5000;
export const MAX_ALIAS_COUNT = 5;
export const MAX_ALIAS_LENGTH = 10;
export const MAX_CATEGORY_LENGTH = 30;
