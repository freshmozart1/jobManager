import { PersonalInformationExperienceItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash } from "lucide-react";
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
    return <Card>
        <CardHeader className="space-y-1">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <CardTitle className="text-base">{item.role}</CardTitle>
                    <CardDescription>{item.company}</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit experience"
                        onClick={() => {
                            if (interactionsLocked) return;
                            editor.openEdit(index);
                        }}
                        disabled={interactionsLocked}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete experience"
                        onClick={() => {
                            if (interactionsLocked) return;
                            void editor.deleteByIndices([index], "Failed to delete experience. Item was restored.");
                        }}
                        disabled={interactionsLocked}
                    >
                        <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>
            <p className="text-sm font-medium text-foreground">{`${formatMonthYear(item.from)} – ${item.to ? formatMonthYear(item.to) : "Present"}`}</p>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
    </Card>
};