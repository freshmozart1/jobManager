import { PersonalInformationLanguageSpoken } from "@/types";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import { useAppDrawer } from "../AppDrawer";
import { useEffect, useRef } from "react";
import AppLanguageItemForm from "./appLanguageItemForm";
import { cn } from "@/lib/utils";
import AppLanguageCard from "./appLanguageCard";
import AppAddItemButton from "../appItemEditor/appAddItemButton";
import { AppItemUndoBanner } from "../appItemEditor/AppItemUndoBanner";

type AppLanguageCardContainerProps = {
    editor: ItemEditorController<PersonalInformationLanguageSpoken>;
};

export default function AppLanguageCardContainer({ editor }: AppLanguageCardContainerProps) {
    const { toggleDrawer } = useAppDrawer();
    const prevSheetOpen = useRef(editor.sheetOpen);

    useEffect(() => {
        if (editor.sheetOpen) toggleDrawer(
            "right",
            <AppLanguageItemForm
                key={editor.formKey}
                mode={editor.sheetMode}
                initialValue={editor.sheetInitialItem}
                onSubmit={(item) => editor.submitItem(item, "Failed to save language. Reverted changes.")}
                onCancel={editor.closeSheet}
                disabled={editor.isPersisting}
            />,
            0,
            true
        );
        else if (prevSheetOpen.current) toggleDrawer("right", undefined);
        prevSheetOpen.current = editor.sheetOpen;
    }, [editor, toggleDrawer]);

    return <div className="space-y-4">
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
            <AppAddItemButton editor={editor} label="Add language" />
            {
                editor.items.map((item, index) => <AppLanguageCard
                    key={index}
                    language={item}
                    editor={editor}
                    index={index}
                />)
            }
        </div>

        <AppItemUndoBanner
            undoState={editor.undoState}
            pauseUndoTimer={editor.pauseUndoTimer}
            resumeUndoTimer={editor.resumeUndoTimer}
            onUndo={() => void editor.undoDelete("Failed to undo delete. Changes were reverted.")}
            onDismiss={editor.dismissUndo}
        />
    </div>
}
