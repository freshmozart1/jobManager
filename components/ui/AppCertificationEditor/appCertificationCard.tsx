import { PersonalInformationCertification } from "@/types";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import AppEditableCard from "../appItemEditor/appEditableCard";
import { useMemo } from "react";
import { formatMonthYear } from "@/lib/utils";

type AppCertificationCardProps = {
    certificate: PersonalInformationCertification;
    editor: ItemEditorController<PersonalInformationCertification>;
    index: number;
};

export default function AppCertificationCard({ certificate, editor, index }: AppCertificationCardProps) {
    const issued = useMemo(() => formatMonthYear(new Date(certificate.issued)), [certificate.issued]);
    const interactionsLocked = editor.isPersisting;
    return <AppEditableCard
        title={certificate.name}
        editAriaLabel="Edit certificate"
        deleteAriaLabel="Delete certificate"
        onEdit={() => editor.openEdit(index)}
        onDelete={() => editor.deleteByIndices([index], "Failed to delete certification. Item was restored.")}
        disabled={interactionsLocked}
    >
        <p className="text-sm text-muted-foreground">Issued: {issued}</p>
    </AppEditableCard>
};