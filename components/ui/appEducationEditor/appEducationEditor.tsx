'use client'

import { PersonalInformationEducation } from "@/types";
import { normaliseEducationItems } from "@/lib/personal";
import { AppItemEditor } from "@/components/ui/appItemEditor/AppItemEditor";
import AppEducationCardContainer from "./appEducationCardContainer";

type AppEducationEditorProps = {
    education: PersonalInformationEducation[];
    onChange: (items: PersonalInformationEducation[]) => void;
    onPersist: (items: PersonalInformationEducation[]) => Promise<void>;
};

export default function AppEducationEditor({ education, onChange, onPersist }: AppEducationEditorProps) {
    return (
        <AppItemEditor<PersonalInformationEducation>
            items={education}
            normaliseItems={normaliseEducationItems}
            sortItems={(items: PersonalInformationEducation[]) => [...items].sort((a: PersonalInformationEducation, b: PersonalInformationEducation) => b.graduation_year - a.graduation_year)}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={(item: PersonalInformationEducation) => {
                const degree = item.degree.trim();
                const institution = item.institution.trim();
                if (!degree && !institution) return "Education";
                if (!institution) return degree;
                return `${degree} @ ${institution}`;
            }}
        >
            {
                editor => <AppEducationCardContainer editor={editor} />
            }
        </AppItemEditor>
    );
}
