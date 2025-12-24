"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { useUndo } from "./useUndo";

export type UndoState<TItem> = {
    labels: string[];
    mergedCount: number;
    snapshot: TItem[];
};

export type UseItemEditorOptions<TItem> = {
    items: unknown;
    normaliseItems: (value: unknown) => TItem[];
    sortItems?: (items: TItem[]) => TItem[];
    cloneItems?: (items: TItem[]) => TItem[];

    onChange: (items: TItem[]) => void;
    onPersist: (items: TItem[]) => Promise<void>;

    getItemLabel: (item: TItem) => string;

    undoTimeoutMs?: number;
    errorTimeoutMs?: number;

    initialSheetMode?: "create" | "edit";
};

export type ItemEditorController<TItem> = {
    items: TItem[];
    setItems: Dispatch<SetStateAction<TItem[]>>;
    isPersisting: boolean;
    persistError: string | null;
    clearPersistError: () => void;
    commit: (nextItems: TItem[], snapshot?: TItem[], errorMessage?: string) => Promise<void>;

    undoState: UndoState<TItem> | null;
    deleteByIndices: (indicesToRemove: number[], errorMessage?: string) => Promise<void>;
    undoDelete: (errorMessage?: string) => Promise<void>;
    dismissUndo: () => void;
    pauseUndoTimer: () => void;
    resumeUndoTimer: () => void;

    sheetOpen: boolean;
    sheetMode: "create" | "edit";
    sheetItemIndex: number | null;
    formKey: number;
    sheetInitialItem: TItem | undefined;
    openCreate: () => void;
    openEdit: (index: number) => void;
    closeSheet: () => void;
    submitItem: (item: TItem, errorMessage?: string) => Promise<void>;
};

function defaultCloneItems<TItem>(items: TItem[]): TItem[] {
    if (typeof structuredClone === "function") {
        return structuredClone(items);
    }
    return [...items];
}

export function useItemEditor<TItem>(options: UseItemEditorOptions<TItem>) {
    const {
        items: itemsSource,
        normaliseItems,
        sortItems,
        cloneItems = defaultCloneItems,
        onChange,
        onPersist,
        getItemLabel,
        undoTimeoutMs = 5000,
        errorTimeoutMs = 15000,
        initialSheetMode = "create",
    } = options;

    const initialisedRef = useRef(false);
    const previousCommittedRef = useRef<TItem[]>([]);

    const prepareItems = useCallback(
        (value: unknown): TItem[] => {
            const normalised = normaliseItems(value);
            const sorted = sortItems ? sortItems(normalised) : normalised;
            return sorted;
        },
        [normaliseItems, sortItems]
    );

    const [items, setItems] = useState<TItem[]>(() => prepareItems(itemsSource));

    const [isPersisting, setIsPersisting] = useState(false);
    const [persistError, setPersistError] = useState<string | null>(null);
    const errorTimerRef = useRef<number | null>(null);

    const {
        state: undoState,
        setState: setUndoState,
        pause: pauseUndoTimer,
        resume: resumeUndoTimer,
        clear: clearUndo,
    } = useUndo<UndoState<TItem>>({ timeoutMs: undoTimeoutMs });

    useEffect(() => {
        return () => {
            if (errorTimerRef.current) {
                window.clearTimeout(errorTimerRef.current);
                errorTimerRef.current = null;
            }
        };
    }, []);

    const showPersistError = useCallback(
        (message: string) => {
            if (errorTimerRef.current) {
                window.clearTimeout(errorTimerRef.current);
            }
            setPersistError(message);
            errorTimerRef.current = window.setTimeout(() => {
                setPersistError(null);
                errorTimerRef.current = null;
            }, errorTimeoutMs);
        },
        [errorTimeoutMs]
    );

    const clearPersistError = useCallback(() => {
        if (errorTimerRef.current) {
            window.clearTimeout(errorTimerRef.current);
            errorTimerRef.current = null;
        }
        setPersistError(null);
    }, []);

    useEffect(() => {
        const prepared = prepareItems(itemsSource);
        if (!initialisedRef.current) {
            initialisedRef.current = true;
            setItems(prepared);
            previousCommittedRef.current = cloneItems(prepared);
            return;
        }
        setItems(prepared);
        previousCommittedRef.current = cloneItems(prepared);
    }, [itemsSource, prepareItems, cloneItems]);

    const commit = useCallback(
        async (nextItems: TItem[], snapshot?: TItem[], errorMessage?: string) => {
            const fallback = snapshot ? cloneItems(snapshot) : cloneItems(previousCommittedRef.current);

            setItems(nextItems);
            onChange(nextItems);

            setIsPersisting(true);
            clearPersistError();
            try {
                await onPersist(nextItems);
                previousCommittedRef.current = cloneItems(nextItems);
            } catch (error) {
                console.error(errorMessage ?? "Failed to persist items", error);
                setItems(fallback);
                onChange(fallback);
                showPersistError(errorMessage ?? "Save failed. Reverted.");
            } finally {
                setIsPersisting(false);
            }
        },
        [cloneItems, onChange, onPersist, clearPersistError, showPersistError]
    );

    const deleteByIndices = useCallback(
        async (indicesToRemove: number[], errorMessage?: string) => {
            const unique = Array.from(new Set(indicesToRemove)).filter((n) => Number.isInteger(n)).sort((a, b) => a - b);
            if (unique.length === 0) return;

            const snapshot = cloneItems(items);
            const remaining = items.filter((_, index) => !unique.includes(index));

            const removedLabels = unique
                .map((index) => items[index])
                .filter(Boolean)
                .map(getItemLabel)
                .filter((value) => value.trim().length > 0);

            setUndoState((prev) =>
                prev
                    ? {
                        labels: Array.from(new Set([...prev.labels, ...removedLabels])).sort((a, b) => a.localeCompare(b)),
                        mergedCount: prev.mergedCount + 1,
                        snapshot: prev.snapshot,
                    }
                    : {
                        labels: removedLabels,
                        mergedCount: 1,
                        snapshot,
                    }
            );

            await commit(remaining, snapshot, errorMessage ?? "Failed to delete. Item(s) were restored.");
        },
        [items, cloneItems, getItemLabel, setUndoState, commit]
    );

    const undoDelete = useCallback(
        async (errorMessage?: string) => {
            if (!undoState) return;
            const restored = cloneItems(undoState.snapshot);
            clearUndo();
            await commit(restored, items, errorMessage ?? "Failed to undo. Changes were reverted.");
        },
        [undoState, cloneItems, clearUndo, commit, items]
    );

    const dismissUndo = useCallback(() => {
        clearUndo();
    }, [clearUndo]);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<"create" | "edit">(initialSheetMode);
    const [sheetItemIndex, setSheetItemIndex] = useState<number | null>(null);
    const [formKey, setFormKey] = useState(0);

    const openCreate = useCallback(() => {
        setSheetMode("create");
        setSheetItemIndex(null);
        setFormKey((prev) => prev + 1);
        setSheetOpen(true);
    }, []);

    const openEdit = useCallback((index: number) => {
        setSheetMode("edit");
        setSheetItemIndex(index);
        setFormKey((prev) => prev + 1);
        setSheetOpen(true);
    }, []);

    const closeSheet = useCallback(() => {
        setSheetItemIndex(null);
        setSheetOpen(false);
    }, []);

    const sheetInitialItem = useMemo(() => {
        if (sheetItemIndex == null) return undefined;
        return items[sheetItemIndex];
    }, [items, sheetItemIndex]);

    const submitItem = useCallback(
        async (item: TItem, errorMessage?: string) => {
            const snapshot = cloneItems(items);
            let nextItems: TItem[];

            if (sheetMode === "create") {
                nextItems = [...items, item];
            } else if (sheetItemIndex != null) {
                nextItems = items.map((existing, index) => (index === sheetItemIndex ? item : existing));
            } else {
                nextItems = items;
            }

            const prepared = sortItems ? sortItems(nextItems) : nextItems;
            closeSheet();
            await commit(prepared, snapshot, errorMessage ?? "Failed to save. Reverted changes.");
        },
        [items, sheetMode, sheetItemIndex, cloneItems, sortItems, closeSheet, commit]
    );

    const controller: ItemEditorController<TItem> = {
        items,
        setItems,
        isPersisting,
        persistError,
        clearPersistError,
        commit,

        undoState,
        deleteByIndices,
        undoDelete,
        dismissUndo,
        pauseUndoTimer,
        resumeUndoTimer,

        sheetOpen,
        sheetMode,
        sheetItemIndex,
        formKey,
        sheetInitialItem,
        openCreate,
        openEdit,
        closeSheet,
        submitItem,
    };

    return controller;
}
