'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit, Plus, RotateCcw, Trash } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppExperienceItemForm from "@/components/ui/appExperienceItemForm";
import { PersonalInformationExperienceItem } from "@/types";
import { cn, formatMonthYear } from "@/lib/utils";
import { experienceItemsEqual, normaliseExperienceItems, sortExperienceItems } from "@/lib/experience";

type AppExperienceEditorProps = {
    experience: PersonalInformationExperienceItem[];
    onChange: (items: PersonalInformationExperienceItem[]) => void;
    onPersist: (items: PersonalInformationExperienceItem[]) => Promise<void>;
};

type PendingDeleteState = {
    key: string;
    item: PersonalInformationExperienceItem;
    timeoutId: number;
};

const DELETE_DELAY_MS = 5000;
const ERROR_BANNER_TIMEOUT_MS = 15000;
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

export default function AppExperienceEditor({ experience, onChange, onPersist }: AppExperienceEditorProps) {
    const [items, setItems] = useState<PersonalInformationExperienceItem[]>(() => sortExperienceItems(normaliseExperienceItems(experience)));
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
    const [sheetItemIndex, setSheetItemIndex] = useState<number | null>(null);
    const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);
    const [isPersisting, setIsPersisting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const errorTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (errorTimerRef.current) {
                window.clearTimeout(errorTimerRef.current);
                errorTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            if (pendingDelete) {
                window.clearTimeout(pendingDelete.timeoutId);
            }
        };
    }, [pendingDelete]);

    useEffect(() => {
        setItems(sortExperienceItems(normaliseExperienceItems(experience)));
    }, [experience]);

    const showError = useCallback((message: string) => {
        if (errorTimerRef.current) {
            window.clearTimeout(errorTimerRef.current);
        }
        setErrorMessage(message);
        errorTimerRef.current = window.setTimeout(() => {
            setErrorMessage(null);
            errorTimerRef.current = null;
        }, ERROR_BANNER_TIMEOUT_MS);
    }, []);

    const interactionsLocked = Boolean(pendingDelete) || isPersisting;

    const handleOpenCreate = () => {
        if (interactionsLocked) return;
        setSheetMode("create");
        setSheetItemIndex(null);
        setSheetOpen(true);
    };

    const handleOpenEdit = (index: number) => {
        if (interactionsLocked) return;
        setSheetMode("edit");
        setSheetItemIndex(index);
        setSheetOpen(true);
    };

    const refreshParent = useCallback((nextItems: PersonalInformationExperienceItem[]) => {
        setItems(nextItems);
        onChange(nextItems);
    }, [onChange]);

    const persistChanges = useCallback(async (nextItems: PersonalInformationExperienceItem[], fallback: PersonalInformationExperienceItem[], message: string) => {
        setIsPersisting(true);
        try {
            await onPersist(nextItems);
        } catch (error) {
            console.error(message, error);
            refreshParent(fallback);
            showError(message);
        } finally {
            setIsPersisting(false);
        }
    }, [onPersist, refreshParent, showError]);

    const handleSubmit = async (item: PersonalInformationExperienceItem) => {
        const snapshot = items;
        let nextItems: PersonalInformationExperienceItem[];
        if (sheetMode === "create") {
            nextItems = sortExperienceItems([...items, item]);
        } else if (sheetItemIndex != null) {
            nextItems = sortExperienceItems(items.map((existing, index) => (index === sheetItemIndex ? item : existing)));
        } else {
            nextItems = items;
        }
        refreshParent(nextItems);
        await persistChanges(nextItems, snapshot, "Failed to save experience. Reverted changes.");
    };

    const finalizeDelete = useCallback(async (state: PendingDeleteState) => {
        const snapshot = items;
        const nextItems = sortExperienceItems(items.filter((item) => !experienceItemsEqual(item, state.item)));
        refreshParent(nextItems);
        setPendingDelete(null);
        await persistChanges(nextItems, snapshot, "Failed to delete experience. Item was restored.");
    }, [items, refreshParent, persistChanges]);

    const handleDelete = (index: number) => {
        if (interactionsLocked || pendingDelete) return;
        const target = items[index];
        if (!target) return;
        const state: PendingDeleteState = {
            key: getItemKey(target),
            item: target,
            timeoutId: window.setTimeout(() => {
                finalizeDelete(state).catch(() => {
                    // Error is handled in persistChanges
                });
            }, DELETE_DELAY_MS),
        };
        setPendingDelete(state);
    };

    const handleUndoDelete = () => {
        if (!pendingDelete) return;
        window.clearTimeout(pendingDelete.timeoutId);
        setPendingDelete(null);
    };

    const pendingKey = pendingDelete?.key;

    const cards = useMemo(() => sortExperienceItems(items), [items]);

    return (
        <div className="space-y-4">
            <div aria-live="polite" className="sr-only">
                {pendingDelete ? `Deletion scheduled for ${pendingDelete.item.role} at ${pendingDelete.item.company}. Undo within five seconds.` : ""}
                {errorMessage ? `Error: ${errorMessage}` : ""}
            </div>
            {errorMessage && (
                <div
                    className={cn(
                        "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                        "transition-opacity duration-200",
                        errorMessage ? "opacity-100" : "opacity-0"
                    )}
                >
                    {errorMessage}
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <button
                    type="button"
                    onClick={handleOpenCreate}
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
                {cards.map((item, index) => {
                    const key = getItemKey(item);
                    const isPending = pendingKey === key;
                    const snippet = truncateSummary(item.summary);
                    const dateLabel = `${formatMonthYear(item.from)} – ${item.to ? formatMonthYear(item.to) : "Present"}`;
                    return (
                        <Card key={key} className={cn(isPending && "opacity-60")}
                            data-state={isPending ? "pending-delete" : undefined}
                        >
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
                                            onClick={() => handleOpenEdit(index)}
                                            disabled={interactionsLocked}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        {isPending ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Undo delete"
                                                onClick={handleUndoDelete}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Delete experience"
                                                onClick={() => handleDelete(index)}
                                                disabled={interactionsLocked}
                                            >
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
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
            <AppExperienceItemForm
                open={sheetOpen}
                mode={sheetMode}
                initialValue={sheetItemIndex != null ? cards[sheetItemIndex] : undefined}
                onOpenChange={(next) => {
                    if (!next) {
                        setSheetOpen(false);
                        setSheetItemIndex(null);
                    } else {
                        setSheetOpen(true);
                    }
                }}
                onSubmit={handleSubmit}
                onCancel={() => {
                    setSheetItemIndex(null);
                }}
                disabled={interactionsLocked}
            />
        </div>
    );
}
