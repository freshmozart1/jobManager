import { PersonalInformationEducation } from "@/types";

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

export function sortEducationItems(items: PersonalInformationEducation[]): PersonalInformationEducation[] {
    return [...items].sort((a, b) => b.graduation_year - a.graduation_year);
}

export function educationItemsEqual(a: PersonalInformationEducation, b: PersonalInformationEducation): boolean {
    return (
        a.degree === b.degree &&
        a.field === b.field &&
        a.institution === b.institution &&
        a.graduation_year === b.graduation_year
    );
}
