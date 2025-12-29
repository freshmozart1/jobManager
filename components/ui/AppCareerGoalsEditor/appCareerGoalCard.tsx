import { PersonalInformationCareerGoal } from "@/types";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import AppEditableCard from "../appItemEditor/appEditableCard";

type AppCareerGoalCardProps = {
    careerGoal: PersonalInformationCareerGoal;
    editor: ItemEditorController<PersonalInformationCareerGoal>;
    index: number;
};

export default function AppCareerGoalCard({ careerGoal, editor, index }: AppCareerGoalCardProps) {
    const interactionsLocked = editor.isPersisting;
    return <AppEditableCard
        title={careerGoal.topic}
        editAriaLabel="Edit career goal"
        deleteAriaLabel="Delete career goal"
        onEdit={() => editor.openEdit(index)}
        onDelete={() => editor.deleteByIndices([index], "Failed to delete career goal. Item was restored.")}
        disabled={interactionsLocked}
    >
        <p className="text-sm text-muted-foreground line-clamp-2">{careerGoal.description}</p>
    </AppEditableCard>
};
