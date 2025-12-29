'use client';

import { PersonalInformationEducation } from "@/types";
import { normaliseEducationItems } from "@/lib/personal";
import {
    AppItemEditor,
    AppGenericCardContainer,
    EditorConfig,
} from "./appItemEditor";

const educationConfig: EditorConfig<PersonalInformationEducation> = {
    singularLabel: "education",
    pluralLabel: "education",
    fields: [
        {
            type: "text",
            name: "degree",
            label: "Degree",
            required: true,
        },
        {
            type: "text",
            name: "field",
            label: "Field of Study",
            required: true,
        },
        {
            type: "text",
            name: "institution",
            label: "Institution",
            required: true,
        },
        {
            type: "number",
            name: "graduation_year",
            label: "Graduation Year",
            required: true,
        },
    ],
    defaultValue: {
        degree: "",
        field: "",
        institution: "",
        graduation_year: new Date().getFullYear(),
    },
    getItemLabel: (item) => {
        const degree = item.degree.trim();
        const institution = item.institution.trim();
        if (!degree && !institution) return "Education";
        if (!institution) return degree;
        return `${degree} @ ${institution}`;
    },
    getCardTitle: (item) => item.degree,
    getCardDescription: (item) => item.institution,
    cardContentClassName: "space-y-1",
    renderCardContent: (item) => (
        <>
            <p className="text-sm font-medium">{item.field}</p>
            <p className="text-sm text-muted-foreground">Graduated: {item.graduation_year}</p>
        </>
    ),
    normaliseItems: normaliseEducationItems,
    sortItems: (items) => [...items].sort((a, b) => b.graduation_year - a.graduation_year),
};

type AppEducationEditorProps = {
    education: PersonalInformationEducation[];
    onChange: (items: PersonalInformationEducation[]) => void;
    onPersist: (items: PersonalInformationEducation[]) => Promise<void>;
};

export default function AppEducationEditor({
    education,
    onChange,
    onPersist,
}: AppEducationEditorProps) {
    return (
        <AppItemEditor<PersonalInformationEducation>
            items={education}
            normaliseItems={educationConfig.normaliseItems}
            sortItems={educationConfig.sortItems}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={educationConfig.getItemLabel}
        >
            {(editor) => (
                <AppGenericCardContainer<PersonalInformationEducation>
                    editor={editor}
                    config={educationConfig}
                />
            )}
        </AppItemEditor>
    );
}
