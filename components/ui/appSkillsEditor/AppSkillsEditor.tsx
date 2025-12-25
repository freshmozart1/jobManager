'use client'

import { PersonalInformationSkill } from "@/types";
import { cloneSkills, sortSkills } from ".";
import { AppItemEditor } from "@/components/ui/appItemEditor/AppItemEditor";
import AppSkillsEditorInner from "./AppSkillsEditorInner";

export type SkillDraft = {
    name: string;
    category: string;
    level: string;
    years: string;
    last_used: string;
    aliases: string[];
    primary: boolean;
};

export type ValidationErrors = Partial<Record<keyof SkillDraft, string>> & { aliases?: string };

type AppSkillsEditorProps = {
    skills: PersonalInformationSkill[];
    onChange: (skills: PersonalInformationSkill[]) => void;
    onPersist: (skills: PersonalInformationSkill[]) => Promise<void>;
    onRegisterAddSkill?: (handler: (() => void) | null) => void;
};

function normaliseSkills(value: unknown): PersonalInformationSkill[] {
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

export default function AppSkillsEditor({
    skills: skillsProp,
    onChange,
    onPersist,
    onRegisterAddSkill
}: AppSkillsEditorProps) {
    return (
        <AppItemEditor<PersonalInformationSkill>
            items={skillsProp}
            normaliseItems={normaliseSkills}
            sortItems={sortSkills}
            cloneItems={cloneSkills}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={item => item.name}
        >
            {(editor) => <AppSkillsEditorInner editor={editor} onRegisterAddSkill={onRegisterAddSkill} />}
        </AppItemEditor>
    );
}