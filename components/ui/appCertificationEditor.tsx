import { PersonalInformationCertification } from "@/types";
import { normaliseCertifications } from "@/lib/personal";
import { formatMonthYear } from "@/lib/utils";
import {
    AppItemEditor,
    AppGenericCardContainer,
    EditorConfig,
} from "./appItemEditor";

const certificationConfig: EditorConfig<PersonalInformationCertification> = {
    singularLabel: "certificate",
    pluralLabel: "certifications",
    fields: [
        {
            type: "text",
            name: "name",
            label: "Name",
            required: true,
        },
        {
            type: "date",
            name: "issued",
            label: "Issued",
            required: true,
        },
        {
            type: "date",
            name: "expires",
            label: "Expires",
            required: false,
            allowClear: true,
        },
    ],
    defaultValue: {
        name: "",
        issued: new Date(),
        expires: null,
    },
    validate: (draft) => {
        const errors: Partial<Record<keyof PersonalInformationCertification, string>> = {};

        // Validate issued date
        if (!draft.issued || !(draft.issued instanceof Date) || Number.isNaN(draft.issued.getTime())) {
            errors.issued = "Issued date is required.";
        }

        // Validate expires date (if provided)
        if (draft.expires) {
            if (!(draft.expires instanceof Date) || Number.isNaN(draft.expires.getTime())) {
                errors.expires = "Invalid expiration date.";
            } else if (draft.issued instanceof Date && !Number.isNaN(draft.issued.getTime())) {
                // Expires must be >= issued
                if (draft.expires < draft.issued) {
                    errors.expires = "Expiration date cannot be before issued date.";
                }
            }
        }

        return errors;
    },
    getItemLabel: (item) => {
        const name = item.name.trim();
        if (!name) return "Certification";
        const issued = item.issued instanceof Date && !Number.isNaN(item.issued.getTime())
            ? formatMonthYear(item.issued)
            : "";
        if (!issued) return name;
        return `${name} (Issued: ${issued})`;
    },
    getCardTitle: (item) => item.name,
    renderCardContent: (item) => {
        const issued = item.issued instanceof Date && !Number.isNaN(item.issued.getTime())
            ? formatMonthYear(item.issued)
            : "Invalid date";
        const expires = item.expires instanceof Date && !Number.isNaN(item.expires.getTime())
            ? formatMonthYear(item.expires)
            : null;

        return (
            <div className="text-sm text-muted-foreground space-y-1">
                <p>Issued: {issued}</p>
                {expires && <p>Expires: {expires}</p>}
            </div>
        );
    },
    normaliseItems: normaliseCertifications,
    sortItems: (items) =>
        [...items].sort((a, b) => {
            const timeA = a.issued instanceof Date ? a.issued.getTime() : 0;
            const timeB = b.issued instanceof Date ? b.issued.getTime() : 0;
            return timeB - timeA; // Newest first
        }),
};

type AppCertificationEditorProps = {
    certifications: PersonalInformationCertification[];
    onChange: (items: PersonalInformationCertification[]) => void;
    onPersist: (items: PersonalInformationCertification[]) => Promise<void>;
};

export default function AppCertificationEditor({
    certifications,
    onChange,
    onPersist,
}: AppCertificationEditorProps) {
    return (
        <AppItemEditor<PersonalInformationCertification>
            items={certifications}
            normaliseItems={certificationConfig.normaliseItems}
            sortItems={certificationConfig.sortItems}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={certificationConfig.getItemLabel}
        >
            {(editor) => (
                <AppGenericCardContainer<PersonalInformationCertification>
                    editor={editor}
                    config={certificationConfig}
                />
            )}
        </AppItemEditor>
    );
}

