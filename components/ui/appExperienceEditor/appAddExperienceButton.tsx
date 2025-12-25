import { PersonalInformationExperienceItem } from "@/types";
import type { ItemEditorController } from "@/components/ui/appItemEditor/useItemEditor";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AddExperienceButtonProps = {
    editor: ItemEditorController<PersonalInformationExperienceItem>;
};

export default function AppAddExperienceButton({ editor }: AddExperienceButtonProps) {
    return <button
        type="button"
        onClick={() => {
            if (editor.isPersisting) return;
            editor.openCreate();
        }}
        disabled={editor.isPersisting}
        className={cn(
            "flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 bg-muted/20 text-muted-foreground transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring",
            editor.isPersisting && "cursor-not-allowed opacity-60"
        )}
    >
        <span className="flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            Add experience
        </span>
    </button>;
}