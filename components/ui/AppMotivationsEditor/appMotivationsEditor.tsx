import { PersonalInformationMotivation } from "@/types";
import { AppItemEditor } from "../appItemEditor/AppItemEditor";
import { normaliseMotivations } from "@/lib/personal";
import AppMotivationCardContainer from "./appMotivationCardContainer";

type AppMotivationsEditorProps = {
    motivations: PersonalInformationMotivation[];
    onChange: (items: PersonalInformationMotivation[]) => void;
    onPersist: (items: PersonalInformationMotivation[]) => Promise<void>;
};

export default function AppMotivationsEditor({ motivations, onChange, onPersist }: AppMotivationsEditorProps) {
    return <AppItemEditor<PersonalInformationMotivation>
        items={motivations}
        normaliseItems={normaliseMotivations}
        sortItems={(items: PersonalInformationMotivation[]) => [...items].sort((a: PersonalInformationMotivation, b: PersonalInformationMotivation) => {
            return a.topic.localeCompare(b.topic);
        })}
        onChange={onChange}
        onPersist={onPersist}
        getItemLabel={(item: PersonalInformationMotivation) => {
            const topic = item.topic.trim();
            if (!topic) return "Motivation";
            return topic;
        }}
    >
        {
            editor => <AppMotivationCardContainer editor={editor} />
        }
    </AppItemEditor>
}
