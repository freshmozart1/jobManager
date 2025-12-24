"use client";

import { Button } from "@/components/ui/button";

import type { UndoState } from "./useItemEditor";

type AppItemUndoBannerProps<TItem> = {
    undoState: UndoState<TItem> | null;
    pauseUndoTimer: () => void;
    resumeUndoTimer: () => void;
    onUndo: () => Promise<void> | void;
    onDismiss: () => void;
    truncateAt?: number;
};

export function AppItemUndoBanner<TItem>({
    undoState,
    pauseUndoTimer,
    resumeUndoTimer,
    onUndo,
    onDismiss,
    truncateAt = 12,
}: AppItemUndoBannerProps<TItem>) {
    if (!undoState) return null;

    const names = undoState.labels
        .map((label) => (label.length > truncateAt ? `${label.slice(0, truncateAt)}…` : label))
        .join(", ");

    return (
        <div
            className="bg-muted border rounded-md px-3 py-2 text-sm flex items-center justify-between gap-3"
            onMouseEnter={pauseUndoTimer}
            onMouseLeave={resumeUndoTimer}
        >
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span>{undoState.mergedCount > 1 ? `Merged ${undoState.mergedCount} groups` : "Deleted"}</span>
                <span className="font-medium text-foreground">{names}</span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onUndo}>
                    Undo
                </Button>
                <Button variant="ghost" size="sm" onClick={onDismiss}>
                    Dismiss
                </Button>
            </div>
        </div>
    );
}
