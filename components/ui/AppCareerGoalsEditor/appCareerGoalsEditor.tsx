import { PersonalInformationCareerGoal } from "@/types";
import { AppItemEditor } from "../appItemEditor/AppItemEditor";
import { normaliseCareerGoals } from "@/lib/personal";
import AppCareerGoalCardContainer from "./appCareerGoalCardContainer";

type AppCareerGoalsEditorProps = {
    careerGoals: PersonalInformationCareerGoal[];
    onChange: (items: PersonalInformationCareerGoal[]) => void;
    onPersist: (items: PersonalInformationCareerGoal[]) => Promise<void>;
};

export default function AppCareerGoalsEditor({ careerGoals, onChange, onPersist }: AppCareerGoalsEditorProps) {
    return <AppItemEditor<PersonalInformationCareerGoal>
        items={careerGoals}
        normaliseItems={normaliseCareerGoals}
        sortItems={(items: PersonalInformationCareerGoal[]) => [...items].sort((a: PersonalInformationCareerGoal, b: PersonalInformationCareerGoal) => {
            return a.topic.localeCompare(b.topic);
        })}
        onChange={onChange}
        onPersist={onPersist}
        getItemLabel={(item: PersonalInformationCareerGoal) => {
            const topic = item.topic.trim();
            if (!topic) return "Career Goal";
            return topic;
        }}
    >
        {
            editor => <AppCareerGoalCardContainer editor={editor} />
        }
    </AppItemEditor>
}
