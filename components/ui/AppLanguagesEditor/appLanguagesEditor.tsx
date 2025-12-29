import { PersonalInformationLanguageSpoken } from "@/types";
import { AppItemEditor } from "../appItemEditor/AppItemEditor";
import { normaliseLanguages } from "@/lib/personal";
import AppLanguageCardContainer from "./appLanguageCardContainer";

type AppLanguagesEditorProps = {
    languages: PersonalInformationLanguageSpoken[];
    onChange: (items: PersonalInformationLanguageSpoken[]) => void;
    onPersist: (items: PersonalInformationLanguageSpoken[]) => Promise<void>;
};

export default function AppLanguagesEditor({ languages, onChange, onPersist }: AppLanguagesEditorProps) {
    return <AppItemEditor<PersonalInformationLanguageSpoken>
        items={languages}
        normaliseItems={normaliseLanguages}
        sortItems={(items: PersonalInformationLanguageSpoken[]) => [...items].sort((a: PersonalInformationLanguageSpoken, b: PersonalInformationLanguageSpoken) =>
            a.language.localeCompare(b.language)
        )}
        onChange={onChange}
        onPersist={onPersist}
        getItemLabel={(item: PersonalInformationLanguageSpoken) => {
            const language = item.language.trim();
            const level = item.level.trim();
            if (!language && !level) return "Language";
            if (!level) return language;
            return `${language} (${level})`;
        }}
    >
        {
            editor => <AppLanguageCardContainer editor={editor} />
        }
    </AppItemEditor>
}
