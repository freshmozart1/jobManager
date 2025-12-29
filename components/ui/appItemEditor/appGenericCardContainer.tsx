"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { useAppDrawer } from "@/components/ui/appDrawer";
import { ItemEditorController } from "./useItemEditor";
import AppAddItemButton from "./appAddItemButton";
import { AppItemUndoBanner } from "./AppItemUndoBanner";
import AppGenericItemForm from "./appGenericItemForm";
import AppGenericCard from "./appGenericCard";

import type { EditorConfig } from "./types";

type AppGenericCardContainerProps<T> = {
    editor: ItemEditorController<T>;
    config: EditorConfig<T>;
};

export default function AppGenericCardContainer<T>({ editor, config }: AppGenericCardContainerProps<T>) {
    const { toggleDrawer } = useAppDrawer();
    const prevSheetOpen = useRef(editor.sheetOpen);

    useEffect(() => {
        if (editor.sheetOpen) {
            toggleDrawer(
                "right",
                <AppGenericItemForm<T>
                    key={editor.formKey}
                    mode={editor.sheetMode}
                    initialValue={editor.sheetInitialItem}
                    onSubmit={(item) =>
                        editor.submitItem(item, `Failed to save ${config.singularLabel}. Reverted changes.`)
                    }
                    onCancel={editor.closeSheet}
                    disabled={editor.isPersisting}
                    config={config}
                />,
                0,
                true
            );
        } else if (prevSheetOpen.current) {
            toggleDrawer("right", undefined);
        }
        prevSheetOpen.current = editor.sheetOpen;
    }, [editor, toggleDrawer, config]);

    return (
        <div className="space-y-4">
            <div aria-live="polite" className="sr-only">
                {editor.undoState
                    ? `Deleted ${editor.undoState.labels.join(", ")}. Undo within five seconds.`
                    : ""}
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
                <AppAddItemButton editor={editor} label={`Add ${config.singularLabel}`} />
                {editor.items.map((item, index) => (
                    <AppGenericCard<T>
                        key={index}
                        item={item}
                        index={index}
                        editor={editor}
                        config={config}
                    />
                ))}
            </div>

            <AppItemUndoBanner
                undoState={editor.undoState}
                pauseUndoTimer={editor.pauseUndoTimer}
                resumeUndoTimer={editor.resumeUndoTimer}
                onUndo={() => void editor.undoDelete(`Failed to undo delete. Changes were reverted.`)}
                onDismiss={editor.dismissUndo}
            />
        </div>
    );
}
