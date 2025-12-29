import { PersonalInformationLanguageSpoken } from "@/types";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import AppEditableCard from "../appItemEditor/appEditableCard";

type AppLanguageCardProps = {
    language: PersonalInformationLanguageSpoken;
    editor: ItemEditorController<PersonalInformationLanguageSpoken>;
    index: number;
};

export default function AppLanguageCard({ language, editor, index }: AppLanguageCardProps) {
    const interactionsLocked = editor.isPersisting;
    return <AppEditableCard
        title={language.language}
        editAriaLabel="Edit language"
        deleteAriaLabel="Delete language"
        onEdit={() => editor.openEdit(index)}
        onDelete={() => editor.deleteByIndices([index], "Failed to delete language. Item was restored.")}
        disabled={interactionsLocked}
    >
        <p className="text-sm text-muted-foreground">Level: {language.level}</p>
    </AppEditableCard>
}
