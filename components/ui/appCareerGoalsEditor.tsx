import { PersonalInformationCareerGoal } from "@/types";
import { normaliseCareerGoals } from "@/lib/personal";
import {
    AppItemEditor,
    AppGenericCardContainer,
    EditorConfig,
} from "./appItemEditor";

const careerGoalsConfig: EditorConfig<PersonalInformationCareerGoal> = {
    singularLabel: "career goal",
    pluralLabel: "career goals",
    fields: [
        {
            type: "text",
            name: "topic",
            label: "Topic",
            required: true,
            placeholder: "e.g., Become a Staff Engineer",
        },
        {
            type: "textarea",
            name: "description",
            label: "Description",
            required: true,
            placeholder: "Describe the goal",
            rows: 5,
        },
    ],
    defaultValue: {
        topic: "",
        description: "",
        reason_lite: "",
    },
    getItemLabel: (item) => item.topic.trim() || "Career Goal",
    getCardTitle: (item) => item.topic,
    renderCardContent: (item) => (
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
    ),
    normaliseItems: normaliseCareerGoals,
    sortItems: (items) => [...items].sort((a, b) => a.topic.localeCompare(b.topic)),
    transformBeforeSubmit: (draft) => ({ ...draft, reason_lite: "" }),
};

type AppCareerGoalsEditorProps = {
    careerGoals: PersonalInformationCareerGoal[];
    onChange: (items: PersonalInformationCareerGoal[]) => void;
    onPersist: (items: PersonalInformationCareerGoal[]) => Promise<void>;
};

export default function AppCareerGoalsEditor({
    careerGoals,
    onChange,
    onPersist,
}: AppCareerGoalsEditorProps) {
    return (
        <AppItemEditor<PersonalInformationCareerGoal>
            items={careerGoals}
            normaliseItems={careerGoalsConfig.normaliseItems}
            sortItems={careerGoalsConfig.sortItems}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={careerGoalsConfig.getItemLabel}
        >
            {(editor) => (
                <AppGenericCardContainer<PersonalInformationCareerGoal>
                    editor={editor}
                    config={careerGoalsConfig}
                />
            )}
        </AppItemEditor>
    );
}
