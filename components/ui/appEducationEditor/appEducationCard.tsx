import { PersonalInformationEducation } from "@/types";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import AppEditableCard from "../appItemEditor/appEditableCard";

type AppEducationCardProps = {
    item: PersonalInformationEducation;
    editor: ItemEditorController<PersonalInformationEducation>;
    educationItemIndex: number;
};

export default function AppEducationCard({ item, editor, educationItemIndex: index }: AppEducationCardProps) {
    const interactionsLocked = editor.isPersisting;
    return (
        <AppEditableCard
            title={item.degree}
            description={item.institution}
            editAriaLabel="Edit education"
            deleteAriaLabel="Delete education"
            onEdit={() => editor.openEdit(index)}
            onDelete={() => editor.deleteByIndices([index], "Failed to delete education. Item was restored.")}
            disabled={interactionsLocked}
            contentClassName="space-y-1"
        >
            <p className="text-sm font-medium">{item.field}</p>
            <p className="text-sm text-muted-foreground">Graduated: {item.graduation_year}</p>
        </AppEditableCard>
    );
}