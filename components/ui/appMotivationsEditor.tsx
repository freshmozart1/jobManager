import { PersonalInformationMotivation } from "@/types";
import { normaliseMotivations } from "@/lib/personal";
import {
    AppItemEditor,
    AppGenericCardContainer,
    EditorConfig,
} from "./appItemEditor";

const motivationsConfig: EditorConfig<PersonalInformationMotivation> = {
    singularLabel: "motivation",
    pluralLabel: "motivations",
    fields: [
        {
            type: "text",
            name: "topic",
            label: "Topic",
            required: true,
            placeholder: "e.g., Work-Life Balance",
        },
        {
            type: "textarea",
            name: "description",
            label: "Description",
            required: true,
            placeholder: "Describe why this motivates you...",
            rows: 5,
        },
    ],
    defaultValue: {
        topic: "",
        description: "",
        reason_lite: "",
    },
    getItemLabel: (item) => item.topic.trim() || "Motivation",
    getCardTitle: (item) => item.topic,
    renderCardContent: (item) => (
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
    ),
    normaliseItems: normaliseMotivations,
    sortItems: (items) => [...items].sort((a, b) => a.topic.localeCompare(b.topic)),
    transformBeforeSubmit: (draft) => ({ ...draft, reason_lite: "" }),
};

type AppMotivationsEditorProps = {
    motivations: PersonalInformationMotivation[];
    onChange: (items: PersonalInformationMotivation[]) => void;
    onPersist: (items: PersonalInformationMotivation[]) => Promise<void>;
};

export default function AppMotivationsEditor({
    motivations,
    onChange,
    onPersist,
}: AppMotivationsEditorProps) {
    return (
        <AppItemEditor<PersonalInformationMotivation>
            items={motivations}
            normaliseItems={motivationsConfig.normaliseItems}
            sortItems={motivationsConfig.sortItems}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={motivationsConfig.getItemLabel}
        >
            {(editor) => (
                <AppGenericCardContainer<PersonalInformationMotivation>
                    editor={editor}
                    config={motivationsConfig}
                />
            )}
        </AppItemEditor>
    );
}
