'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit, Plus, RotateCcw, Trash } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppEducationItemForm from "@/components/ui/appEducationItemForm";
import { PersonalInformationEducation } from "@/types";
import { cn } from "@/lib/utils";
import { educationItemsEqual, normaliseEducationItems, sortEducationItems } from "@/lib/education";
import { useAppDrawer } from "@/components/ui/AppDrawer";

type AppEducationEditorProps = {
    education: PersonalInformationEducation[];
    onChange: (items: PersonalInformationEducation[]) => void;
    onPersist: (items: PersonalInformationEducation[]) => Promise<void>;
};

type PendingDeleteState = {
    key: string;
    item: PersonalInformationEducation;
    timeoutId: number;
};

const DELETE_DELAY_MS = 5000;
const ERROR_BANNER_TIMEOUT_MS = 15000;

function getItemKey(item: PersonalInformationEducation): string {
    return [
        item.degree,
        item.field,
        item.institution,
        item.graduation_year,
    ].join("::");
}

export default function AppEducationEditor({ education, onChange, onPersist }: AppEducationEditorProps) {
    const [items, setItems] = useState<PersonalInformationEducation[]>(() => sortEducationItems(normaliseEducationItems(education)));
    const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
    const [sheetItemIndex, setSheetItemIndex] = useState<number | null>(null);
    const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);
    const [isPersisting, setIsPersisting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const errorTimerRef = useRef<number | null>(null);

    const { toggleDrawer } = useAppDrawer();

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
        setItems(sortEducationItems(normaliseEducationItems(education)));
    }, [education]);

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

    const refreshParent = useCallback((nextItems: PersonalInformationEducation[]) => {
        setItems(nextItems);
        onChange(nextItems);
    }, [onChange]);

    const persistChanges = useCallback(async (nextItems: PersonalInformationEducation[], fallback: PersonalInformationEducation[], message: string) => {
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

    const handleSubmit = useCallback(async (item: PersonalInformationEducation) => {
        const snapshot = items;
        let nextItems: PersonalInformationEducation[];
        if (sheetMode === "create") {
            nextItems = sortEducationItems([...items, item]);
        } else if (sheetItemIndex != null) {
            nextItems = sortEducationItems(items.map((existing, index) => (index === sheetItemIndex ? item : existing)));
        } else {
            nextItems = items;
        }
        refreshParent(nextItems);
        setSheetOpen(false);
        await persistChanges(nextItems, snapshot, "Failed to save education. Reverted changes.");
    }, [items, sheetMode, sheetItemIndex, refreshParent, persistChanges]);

    const handleCancel = useCallback(() => {
        setSheetItemIndex(null);
        setSheetOpen(false);
    }, []);

    const drawerContent = useMemo(() => {
        const initialValue = sheetItemIndex != null ? items[sheetItemIndex] : undefined;
        return (
            <AppEducationItemForm
                key={formKey}
                mode={sheetMode}
                initialValue={initialValue}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                disabled={interactionsLocked}
            />
        );
    }, [sheetMode, sheetItemIndex, items, handleSubmit, handleCancel, interactionsLocked, formKey]);

    const prevSheetOpen = useRef(sheetOpen);

    useEffect(() => {
        if (sheetOpen) {
            toggleDrawer('right', drawerContent, 0, true);
        } else if (prevSheetOpen.current) {
            toggleDrawer('right', undefined);
        }
        prevSheetOpen.current = sheetOpen;
    }, [sheetOpen, drawerContent, toggleDrawer]);

    const handleOpenCreate = () => {
        if (interactionsLocked) return;
        setSheetMode("create");
        setSheetItemIndex(null);
        setFormKey((prev) => prev + 1);
        setSheetOpen(true);
    };

    const handleOpenEdit = (index: number) => {
        if (interactionsLocked) return;
        setSheetMode("edit");
        setSheetItemIndex(index);
        setFormKey((prev) => prev + 1);
        setSheetOpen(true);
    };

    const finalizeDelete = useCallback(async (state: PendingDeleteState) => {
        const snapshot = items;
        const nextItems = sortEducationItems(items.filter((item) => !educationItemsEqual(item, state.item)));
        refreshParent(nextItems);
        setPendingDelete(null);
        await persistChanges(nextItems, snapshot, "Failed to delete education. Item was restored.");
    }, [items, refreshParent, persistChanges]);

    const handleDelete = (index: number) => {
        if (interactionsLocked) return;
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

    return (
        <div className="space-y-4">
            <div aria-live="polite" className="sr-only">
                {pendingDelete ? `Deletion scheduled for ${pendingDelete.item.degree} at ${pendingDelete.item.institution}. Undo within five seconds.` : ""}
                {errorMessage ? `Error: ${errorMessage}` : ""}
            </div>
            {errorMessage && (
                <div
                    className={cn(
                        "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                        "transition-opacity duration-200",
                        "opacity-100"
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
                        "flex min-h-[150px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 text-muted-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring",
                        interactionsLocked && "cursor-not-allowed opacity-60"
                    )}
                >
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        Add education
                    </span>
                </button>
                {items.map((item, index) => {
                    const key = getItemKey(item);
                    const isPending = pendingKey === key;
                    return (
                        <Card key={key} className={cn(isPending && "opacity-60")}
                            data-state={isPending ? "pending-delete" : undefined}
                        >
                            <CardHeader className="space-y-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base">{item.degree}</CardTitle>
                                        <CardDescription>{item.institution}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Edit education"
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
                                                aria-label="Delete education"
                                                onClick={() => handleDelete(index)}
                                                disabled={interactionsLocked}
                                            >
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <p className="text-sm font-medium">{item.field}</p>
                                <p className="text-sm text-muted-foreground">Graduated: {item.graduation_year}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
