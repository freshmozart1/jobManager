import countriesData from './data/countries.en.json';

/**
 * Returns a list of country names in English, sorted alphabetically.
 * Names are trimmed and de-duplicated (case-insensitive).
 */
export function getCountryNames(): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const country of countriesData) {
        const trimmed = country.trim();
        if (!trimmed) continue;
        
        const normalized = trimmed.toLowerCase();
        if (!seen.has(normalized)) {
            seen.add(normalized);
            result.push(trimmed);
        }
    }

    return result.sort((a, b) => a.localeCompare(b, 'en'));
}
