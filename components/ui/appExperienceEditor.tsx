'use client';

import { PersonalInformationExperience } from "@/types";
import { normaliseExperienceItems } from "@/lib/personal";
import { formatMonthYear } from "@/lib/utils";
import { MaxSkillCount, MaxSkillLength } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
    AppItemEditor,
    AppGenericCardContainer,
    EditorConfig,
    ValidationErrors,
} from "./appItemEditor";

const SUMMARY_SNIPPET_LENGTH = 160;
const MAX_SUMMARY_LENGTH = 2000;

function truncateSummary(summary: string, length: number): string {
    if (summary.length <= length) return summary;
    return `${summary.slice(0, length)}…`;
}

const experienceConfig: EditorConfig<PersonalInformationExperience> = {
    singularLabel: "experience",
    pluralLabel: "experience",
    fields: [
        {
            type: "date",
            name: "from",
            label: "Start month",
            required: true,
        },
        {
            type: "date",
            name: "to",
            label: "End month",
            required: false,
            allowClear: true,
        },
        {
            type: "text",
            name: "role",
            label: "Role",
            required: true,
        },
        {
            type: "text",
            name: "company",
            label: "Company",
            required: true,
        },
        {
            type: "textarea",
            name: "summary",
            label: "Summary",
            required: true,
            rows: 5,
            maxLength: MAX_SUMMARY_LENGTH,
        },
        {
            type: "skills",
            name: "skills",
            label: "Skills",
            required: true,
            placeholder: "Type skill and press ','",
        },
    ],
    defaultValue: {
        from: new Date(),
        to: undefined,
        role: "",
        company: "",
        summary: "",
        skills: [],
    },
    getItemLabel: (item) => {
        const role = item.role.trim();
        const company = item.company.trim();
        if (!role && !company) return "Experience";
        if (!company) return role;
        return `${role} @ ${company}`;
    },
    getCardTitle: (item) => item.role,
    getCardDescription: (item) => item.company,
    getCardMeta: (item) => (
        <p className="text-sm font-medium text-foreground">
            {`${formatMonthYear(item.from)} – ${item.to ? formatMonthYear(item.to) : "Present"}`}
        </p>
    ),
    cardContentClassName: "space-y-3",
    renderCardContent: (item) => (
        <>
            <p className="text-sm text-muted-foreground">
                {truncateSummary(item.summary, SUMMARY_SNIPPET_LENGTH)}
            </p>
            {item.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {item.skills.map((skill, skillIndex) => (
                        <Badge key={`${skill}-${skillIndex}`} variant="secondary">
                            {skill}
                        </Badge>
                    ))}
                </div>
            )}
        </>
    ),
    validate: (draft): ValidationErrors<PersonalInformationExperience> => {
        const errors: ValidationErrors<PersonalInformationExperience> = {};

        // Date range validation
        if (draft.to && draft.from && draft.to.getTime() < draft.from.getTime()) {
            errors.to = "End month cannot be before the start month.";
        }

        // Summary length validation
        if (draft.summary && draft.summary.length > MAX_SUMMARY_LENGTH) {
            errors.summary = `Summary must be ${MAX_SUMMARY_LENGTH} characters or fewer.`;
        }

        // Skills validation
        if (draft.skills.length > MaxSkillCount) {
            errors.skills = `Up to ${MaxSkillCount} tags allowed.`;
        } else if (draft.skills.some((skill) => skill.length > MaxSkillLength)) {
            errors.skills = `Skills must be ${MaxSkillLength} characters or fewer.`;
        }

        return errors;
    },
    isDirty: (draft, initial) => {
        const getTime = (d?: Date) => d?.getTime();
        return (
            getTime(draft.from) !== getTime(initial.from) ||
            getTime(draft.to) !== getTime(initial.to) ||
            draft.role !== initial.role ||
            draft.company !== initial.company ||
            draft.summary !== initial.summary ||
            draft.skills.length !== initial.skills.length ||
            draft.skills.some((skill, i) => skill !== initial.skills[i])
        );
    },
    normaliseItems: normaliseExperienceItems,
    sortItems: (items) =>
        [...items].sort((a, b) => {
            const fromDiff =
                (b.from ? b.from.getTime() : Number.NEGATIVE_INFINITY) -
                (a.from ? a.from.getTime() : Number.NEGATIVE_INFINITY);
            if (fromDiff !== 0) return fromDiff;
            const toDiff =
                (b.to ? b.to.getTime() : Number.POSITIVE_INFINITY) -
                (a.to ? a.to.getTime() : Number.POSITIVE_INFINITY);
            if (toDiff !== 0) return toDiff;
            return a.role.localeCompare(b.role);
        }),
};

type AppExperienceEditorProps = {
    experience: PersonalInformationExperience[];
    onChange: (items: PersonalInformationExperience[]) => void;
    onPersist: (items: PersonalInformationExperience[]) => Promise<void>;
};

export default function AppExperienceEditor({
    experience,
    onChange,
    onPersist,
}: AppExperienceEditorProps) {
    return (
        <AppItemEditor<PersonalInformationExperience>
            items={experience}
            normaliseItems={experienceConfig.normaliseItems}
            sortItems={experienceConfig.sortItems}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={experienceConfig.getItemLabel}
        >
            {(editor) => (
                <AppGenericCardContainer<PersonalInformationExperience>
                    editor={editor}
                    config={experienceConfig}
                />
            )}
        </AppItemEditor>
    );
}

export { AppExperienceEditor };
