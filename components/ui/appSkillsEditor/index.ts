import { PersonalInformationSkill } from "@/types";
import AppSkillsEditor from "./AppSkillsEditor";

export {
    AppSkillsEditor
}
export type SkillRow = {
    skill: PersonalInformationSkill;
    index: number;
};
export function normaliseName(value: string): string {
    return value.trim().toLowerCase();
}
export function cloneSkills(skills: PersonalInformationSkill[]): PersonalInformationSkill[] {
    return skills.map((skill) => ({
        ...skill,
        aliases: [...(skill.aliases ?? [])],
    }));
}

export function sortSkills(skills: PersonalInformationSkill[]): PersonalInformationSkill[] {
    return [...skills].sort((a, b) => a.primary === b.primary
        ? 0
        : a.primary
            ? -1
            : 1
    );
}

