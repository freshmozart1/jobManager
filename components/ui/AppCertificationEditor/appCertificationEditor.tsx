import { PersonalInformationCertification } from "@/types";
import { AppItemEditor } from "../appItemEditor/AppItemEditor";
import { normaliseCertifications } from "@/lib/personal";
import AppCertificationCardContainer from "./appCertificationCardContainer";

type AppCertificationEditorProps = {
    certifications: PersonalInformationCertification[];
    onChange: (items: PersonalInformationCertification[]) => void;
    onPersist: (items: PersonalInformationCertification[]) => Promise<void>;
};

export default function AppCertificationEditor({ certifications, onChange, onPersist }: AppCertificationEditorProps) {
    return <AppItemEditor<PersonalInformationCertification>
        items={certifications}
        normaliseItems={normaliseCertifications}
        sortItems={(items: PersonalInformationCertification[]) => [...items].sort((a: PersonalInformationCertification, b: PersonalInformationCertification) => {
            const issueYearA = a.issued.split("-")[0];
            const issueYearB = b.issued.split("-")[0];
            return Number(issueYearB) - Number(issueYearA);
        })}
        onChange={onChange}
        onPersist={onPersist}
        getItemLabel={(item: PersonalInformationCertification) => {
            const name = item.name.trim();
            const issued = item.issued.trim();
            if (!name && !issued) return "Certification";
            if (!issued) return name;
            return `${name} (Issued: ${issued})`;
        }}
    >
        {
            editor => <AppCertificationCardContainer editor={editor} />
        }
    </AppItemEditor>
}