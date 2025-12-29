import { PersonalInformationMotivation } from "@/types";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import AppEditableCard from "../appItemEditor/appEditableCard";

type AppMotivationCardProps = {
    motivation: PersonalInformationMotivation;
    editor: ItemEditorController<PersonalInformationMotivation>;
    index: number;
};

export default function AppMotivationCard({ motivation, editor, index }: AppMotivationCardProps) {
    const interactionsLocked = editor.isPersisting;
    return <AppEditableCard
        title={motivation.topic}
        editAriaLabel="Edit motivation"
        deleteAriaLabel="Delete motivation"
        onEdit={() => editor.openEdit(index)}
        onDelete={() => editor.deleteByIndices([index], "Failed to delete motivation. Item was restored.")}
        disabled={interactionsLocked}
    >
        <p className="text-sm text-muted-foreground line-clamp-2">{motivation.description}</p>
    </AppEditableCard>
};
