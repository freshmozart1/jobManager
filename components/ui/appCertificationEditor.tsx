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
            type: "dateString",
            name: "issued",
            label: "Issued",
            required: true,
        },
        {
            type: "dateString",
            name: "expires",
            label: "Expires",
            required: false,
            allowClear: true,
            nullOnClear: true,
        },
    ],
    defaultValue: {
        name: "",
        issued: "",
        expires: null,
    },
    getItemLabel: (item) => {
        const name = item.name.trim();
        const issued = item.issued.trim();
        if (!name && !issued) return "Certification";
        if (!issued) return name;
        return `${name} (Issued: ${issued})`;
    },
    getCardTitle: (item) => item.name,
    renderCardContent: (item) => {
        const issued = formatMonthYear(new Date(item.issued));
        return <p className="text-sm text-muted-foreground">Issued: {issued}</p>;
    },
    normaliseItems: normaliseCertifications,
    sortItems: (items) =>
        [...items].sort((a, b) => {
            const issueYearA = a.issued.split("-")[0];
            const issueYearB = b.issued.split("-")[0];
            return Number(issueYearB) - Number(issueYearA);
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
