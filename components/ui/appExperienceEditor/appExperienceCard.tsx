import { PersonalInformationExperienceItem } from "@/types";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import AppEditableCard from "../appItemEditor/appEditableCard";
import { Badge } from "@/components/ui/badge";
import { formatMonthYear } from "@/lib/utils";


type AppExperienceCardProps = {
    item: PersonalInformationExperienceItem;
    editor: ItemEditorController<PersonalInformationExperienceItem>;
    experienceItemIndex: number;
    summarySnippetLength: number;
};

function getItemKey(item: PersonalInformationExperienceItem): string {
    return [
        item.from?.toISOString?.() ?? String(item.from),
        item.to ? (item.to as Date).toISOString?.() ?? String(item.to) : "present",
        item.role,
        item.company,
        item.summary,
        item.tags.join("|"),
    ].join("::");
}

function truncateSummary(summary: string, summarySnippetLength: number): string {
    if (summary.length <= summarySnippetLength) return summary;
    return `${summary.slice(0, summarySnippetLength)}…`;
}

export default function AppExperienceCard({ item, editor, experienceItemIndex: index, summarySnippetLength }: AppExperienceCardProps) {
    const interactionsLocked = editor.isPersisting;
    return (
        <AppEditableCard
            title={item.role}
            description={item.company}
            meta={
                <p className="text-sm font-medium text-foreground">{`${formatMonthYear(item.from)} – ${item.to ? formatMonthYear(item.to) : "Present"}`}</p>
            }
            editAriaLabel="Edit experience"
            deleteAriaLabel="Delete experience"
            onEdit={() => editor.openEdit(index)}
            onDelete={() => editor.deleteByIndices([index], "Failed to delete experience. Item was restored.")}
            disabled={interactionsLocked}
            contentClassName="space-y-3"
        >
            <p className="text-sm text-muted-foreground">{truncateSummary(item.summary, summarySnippetLength)}</p>
            {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, tagIndex) => (
                        <Badge key={`${getItemKey(item)}-${tag}-${tagIndex}`} variant="secondary">
                            {tag}
                        </Badge>
                    ))}
                </div>
            )}
        </AppEditableCard>
    );
}