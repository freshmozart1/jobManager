import { PersonalInformationLanguageSpoken } from "@/types";
import { normaliseLanguages } from "@/lib/personal";
import {
    AppItemEditor,
    AppGenericCardContainer,
    EditorConfig,
} from "./appItemEditor";

const LANGUAGE_LEVEL_OPTIONS = [
    "Native",
    "Fluent",
    "Advanced",
    "Intermediate",
    "Basic",
];

const languagesConfig: EditorConfig<PersonalInformationLanguageSpoken> = {
    singularLabel: "language",
    pluralLabel: "languages",
    fields: [
        {
            type: "text",
            name: "language",
            label: "Language",
            required: true,
            placeholder: "e.g. English, Spanish, German",
        },
        {
            type: "select",
            name: "level",
            label: "Proficiency Level",
            required: true,
            placeholder: "Select or type a level",
            options: LANGUAGE_LEVEL_OPTIONS,
        },
    ],
    defaultValue: {
        language: "",
        level: "",
    },
    getItemLabel: (item) => {
        const language = item.language.trim();
        const level = item.level.trim();
        if (!language && !level) return "Language";
        if (!level) return language;
        return `${language} (${level})`;
    },
    getCardTitle: (item) => item.language,
    renderCardContent: (item) => (
        <p className="text-sm text-muted-foreground">Level: {item.level}</p>
    ),
    normaliseItems: normaliseLanguages,
    sortItems: (items) => [...items].sort((a, b) => a.language.localeCompare(b.language)),
};

type AppLanguagesEditorProps = {
    languages: PersonalInformationLanguageSpoken[];
    onChange: (items: PersonalInformationLanguageSpoken[]) => void;
    onPersist: (items: PersonalInformationLanguageSpoken[]) => Promise<void>;
};

export default function AppLanguagesEditor({
    languages,
    onChange,
    onPersist,
}: AppLanguagesEditorProps) {
    return (
        <AppItemEditor<PersonalInformationLanguageSpoken>
            items={languages}
            normaliseItems={languagesConfig.normaliseItems}
            sortItems={languagesConfig.sortItems}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={languagesConfig.getItemLabel}
        >
            {(editor) => (
                <AppGenericCardContainer<PersonalInformationLanguageSpoken>
                    editor={editor}
                    config={languagesConfig}
                />
            )}
        </AppItemEditor>
    );
}
