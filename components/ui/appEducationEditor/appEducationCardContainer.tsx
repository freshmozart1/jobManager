import { PersonalInformationEducation } from "@/types";
import { ItemEditorController } from "../appItemEditor/useItemEditor";
import { useAppDrawer } from "../AppDrawer";
import { useEffect, useRef } from "react";
import AppEducationItemForm from "./appEducationItemForm";
import { cn } from "@/lib/utils";
import AppAddItemButton from "../appItemEditor/appAddItemButton";
import AppEducationCard from "./appEducationCard";
import { AppItemUndoBanner } from "../appItemEditor/AppItemUndoBanner";

type AppEducationCardContainerProps = {
    editor: ItemEditorController<PersonalInformationEducation>;
};

export default function AppEducationCardContainer({ editor }: AppEducationCardContainerProps) {
    const { toggleDrawer } = useAppDrawer();
    const prevSheetOpen = useRef(editor.sheetOpen);

    useEffect(() => {
        if (editor.sheetOpen) toggleDrawer(
            'right',
            <AppEducationItemForm
                key={editor.formKey}
                mode={editor.sheetMode}
                initialValue={editor.sheetInitialItem}
                onSubmit={(item) => editor.submitItem(item, "Failed to save education. Reverted changes.")}
                onCancel={editor.closeSheet}
                disabled={editor.isPersisting}
            />,
            0,
            true
        );
        else if (prevSheetOpen.current) toggleDrawer('right', undefined);
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
            <AppAddItemButton editor={editor} label="Add education" />
            {
                editor.items.map((item, index) => <AppEducationCard key={index} item={item} editor={editor} educationItemIndex={index} />)
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