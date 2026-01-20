'use client'

import { PersonalInformationSkill } from "@/types";
import { cloneSkills, sortSkills } from ".";
import { AppItemEditor } from "@/components/ui/appItemEditor/AppItemEditor";
import AppSkillsEditorContainer from "./AppSkillsEditorContainer";
import { normaliseSkills } from "@/lib/personal";

export type SkillDraft = {
    name: string;
    category: string;
    level: string;
    years: string;
    last_used: Date | null;
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
            {(editor) => <AppSkillsEditorContainer editor={editor} onRegisterAddSkill={onRegisterAddSkill} />}
        </AppItemEditor>
    );
}