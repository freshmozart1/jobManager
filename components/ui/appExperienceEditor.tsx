'use client'

import { useEffect, useMemo, useRef } from "react";
import { Edit, Plus, Trash } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppExperienceItemForm from "@/components/ui/appExperienceItemForm";
import { PersonalInformationExperienceItem } from "@/types";
import { cn, formatMonthYear } from "@/lib/utils";
import { normaliseExperienceItems, sortExperienceItems } from "@/lib/experience";
import { useAppDrawer } from "@/components/ui/AppDrawer";
import { AppItemEditor } from "@/components/ui/appItemEditor/AppItemEditor";
import { AppItemUndoBanner } from "@/components/ui/appItemEditor/AppItemUndoBanner";

type AppExperienceEditorProps = {
    experience: PersonalInformationExperienceItem[];
    onChange: (items: PersonalInformationExperienceItem[]) => void;
    onPersist: (items: PersonalInformationExperienceItem[]) => Promise<void>;
};
const SUMMARY_SNIPPET_LENGTH = 160;

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

function truncateSummary(summary: string): string {
    if (summary.length <= SUMMARY_SNIPPET_LENGTH) return summary;
    return `${summary.slice(0, SUMMARY_SNIPPET_LENGTH)}…`;
}

function getItemLabel(item: PersonalInformationExperienceItem): string {
    const role = item.role.trim();
    const company = item.company.trim();
    if (!role && !company) return "Experience";
    if (!company) return role;
    return `${role} @ ${company}`;
}

export default function AppExperienceEditor({ experience, onChange, onPersist }: AppExperienceEditorProps) {
    return (
        <AppItemEditor<PersonalInformationExperienceItem>
            items={experience}
            normaliseItems={normaliseExperienceItems}
            sortItems={sortExperienceItems}
            onChange={onChange}
            onPersist={onPersist}
            getItemLabel={getItemLabel}
        >
            {(editor) => {
                type EditorApi = typeof editor;

                function ExperienceEditorInner({ editor }: { editor: EditorApi }) {
                    const { toggleDrawer } = useAppDrawer();
                    const interactionsLocked = editor.isPersisting;

                    const drawerContent = useMemo(() => {
                        return (
                            <AppExperienceItemForm
                                key={editor.formKey}
                                mode={editor.sheetMode}
                                initialValue={editor.sheetInitialItem}
                                onSubmit={(item) => editor.submitItem(item, "Failed to save experience. Reverted changes.")}
                                onCancel={editor.closeSheet}
                                disabled={interactionsLocked}
                            />
                        );
                    }, [editor, interactionsLocked]);

                    const prevSheetOpen = useRef(editor.sheetOpen);

                    useEffect(() => {
                        if (editor.sheetOpen) {
                            toggleDrawer("right", drawerContent, 0, true);
                        } else if (prevSheetOpen.current) {
                            toggleDrawer("right", undefined);
                        }
                        prevSheetOpen.current = editor.sheetOpen;
                    }, [editor, drawerContent, toggleDrawer]);

                    return (
                        <div className="space-y-4">
                            <div aria-live="polite" className="sr-only">
                                {editor.undoState ? `Deleted ${editor.undoState.labels.join(", ")}. Undo within five seconds.` : ""}
                                {editor.persistError ? `Error: ${editor.persistError}` : ""}
                            </div>

                            {editor.persistError && (
                                <div
                                    className={cn(
                                        "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                                        "transition-opacity duration-200",
                                        "opacity-100"
                                    )}
                                >
                                    {editor.persistError}
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (interactionsLocked) return;
                                        editor.openCreate();
                                    }}
                                    disabled={interactionsLocked}
                                    className={cn(
                                        "flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 text-muted-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring",
                                        interactionsLocked && "cursor-not-allowed opacity-60"
                                    )}
                                >
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        <Plus className="h-4 w-4" />
                                        Add experience
                                    </span>
                                </button>

                                {editor.items.map((item, index) => {
                                    const key = getItemKey(item);
                                    const snippet = truncateSummary(item.summary);
                                    const dateLabel = `${formatMonthYear(item.from)} – ${item.to ? formatMonthYear(item.to) : "Present"}`;
                                    return (
                                        <Card key={key}>
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
                                                <p className="text-sm font-medium text-foreground">{dateLabel}</p>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <p className="text-sm text-muted-foreground">{snippet}</p>
                                                {item.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.tags.map((tag, tagIndex) => (
                                                            <Badge key={`${key}-${tag}-${tagIndex}`} variant="secondary">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            <AppItemUndoBanner
                                undoState={editor.undoState}
                                pauseUndoTimer={editor.pauseUndoTimer}
                                resumeUndoTimer={editor.resumeUndoTimer}
                                onUndo={() => void editor.undoDelete("Failed to undo delete. Changes were reverted.")}
                                onDismiss={editor.dismissUndo}
                            />
                        </div>
                    );
                }

                return <ExperienceEditorInner editor={editor} />;
            }}
        </AppItemEditor>
    );
}
