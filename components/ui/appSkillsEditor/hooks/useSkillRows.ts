import { PersonalInformationSkill } from "@/types";
import { useMemo } from "react";

export default function useSkillRows(skills: PersonalInformationSkill[], selectedCategories: Set<string>, debouncedSearch: string, categoryOptions: string[]) {
    const skillRows = useMemo(
        () => skills.map((skill, index) => ({ skill, index })),
        [skills]
    );
    const filteredSkillRows = useMemo(
        () => {
            if (categoryOptions.length === 0) {
                return skillRows.filter(({ skill }) => {
                    if (!debouncedSearch) return true;
                    const value = debouncedSearch;
                    const haystack = [
                        skill.name,
                        skill.category,
                        skill.level,
                        skill.years != null ? String(skill.years) : null,
                        ...skill.aliases,
                    ]
                        .filter((part): part is string => typeof part === "string" && part.length > 0)
                        .map((part) => part.toLowerCase());
                    return haystack.some((part) => part.includes(value));
                });
            }

            if (selectedCategories.size === 0) {
                return [];
            }

            const allCategoriesSelected = selectedCategories.size === categoryOptions.length;

            return skillRows.filter(({ skill }) => {
                const trimmedCategory = skill.category.trim();
                if (trimmedCategory.length === 0) {
                    if (!allCategoriesSelected) {
                        return false;
                    }
                } else if (!selectedCategories.has(trimmedCategory)) {
                    return false;
                }

                if (!debouncedSearch) return true;
                const value = debouncedSearch;
                const haystack = [
                    skill.name,
                    skill.category,
                    skill.level,
                    skill.years != null ? String(skill.years) : null,
                    ...skill.aliases,
                ]
                    .filter((part): part is string => typeof part === "string" && part.length > 0)
                    .map((part) => part.toLowerCase());
                return haystack.some((part) => part.includes(value));
            });
        },
        [skillRows, selectedCategories, debouncedSearch, categoryOptions]
    );
    return [skillRows, filteredSkillRows];
}