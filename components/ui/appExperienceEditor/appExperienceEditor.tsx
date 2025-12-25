'use client'

import { PersonalInformationExperienceItem } from "@/types";
import { normaliseExperienceItems } from "@/lib/personal";
import { AppItemEditor } from "@/components/ui/appItemEditor/AppItemEditor";
import AppExperienceCardContainer from "./appExperienceCardContainer";

type AppExperienceEditorProps = {
    experience: PersonalInformationExperienceItem[];
    onChange: (items: PersonalInformationExperienceItem[]) => void;
    onPersist: (items: PersonalInformationExperienceItem[]) => Promise<void>;
};

export default function AppExperienceEditor({ experience, onChange, onPersist }: AppExperienceEditorProps) {
    return (
        <AppItemEditor<PersonalInformationExperienceItem>
            items={experience}
            normaliseItems={normaliseExperienceItems}
            sortItems={items => [...items].sort((a: PersonalInformationExperienceItem, b: PersonalInformationExperienceItem) => {
                const fromDiff = (b.from ? b.from.getTime() : Number.NEGATIVE_INFINITY) - (a.from ? a.from.getTime() : Number.NEGATIVE_INFINITY);
                if (fromDiff !== 0) return fromDiff;
                const toDiff = (b.to ? b.to.getTime() : Number.POSITIVE_INFINITY) - (a.to ? a.to.getTime() : Number.POSITIVE_INFINITY);
                if (toDiff !== 0) return toDiff;
                return a.role.localeCompare(b.role);
            })}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={(item: PersonalInformationExperienceItem) => {
                const role = item.role.trim();
                const company = item.company.trim();
                if (!role && !company) return "Experience";
                if (!company) return role;
                return `${role} @ ${company}`;
            }}
        >
            {(editor) => <AppExperienceCardContainer editor={editor} />}
        </AppItemEditor>
    );
}

