"use client";

import { Button } from "@/components/ui/button";

export type UndoState = {
    mergedCount: number;
    names: string[];
};

type AppSkillsUndoBannerProps = {
    undoState: UndoState | null;
    pauseUndoTimer: () => void;
    resumeUndoTimer: () => void;
    handleUndo: () => Promise<void> | void;
    handleClearUndo: () => void;
    NAME_TRUNCATE_AT: number;
};

export function AppSkillsUndoBanner({
    undoState,
    pauseUndoTimer,
    resumeUndoTimer,
    handleUndo,
    handleClearUndo,
    NAME_TRUNCATE_AT,
}: AppSkillsUndoBannerProps) {
    if (!undoState) return null;

    return (
        <div
            className="bg-muted border rounded-md px-3 py-2 text-sm flex items-center justify-between gap-3"
            onMouseEnter={pauseUndoTimer}
            onMouseLeave={resumeUndoTimer}
        >
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span>{undoState.mergedCount > 1 ? `Merged ${undoState.mergedCount} groups` : "Deleted"}</span>
                <span className="font-medium text-foreground">
                    {undoState.names
                        .map((name) => (name.length > NAME_TRUNCATE_AT ? `${name.slice(0, NAME_TRUNCATE_AT)}…` : name))
                        .join(", ")}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleUndo}>
                    Undo
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearUndo}>
                    Dismiss
                </Button>
            </div>
        </div>
    );
}
