"use client";

import AppEditableCard from "./appEditableCard";
import { ItemEditorController } from "./useItemEditor";
import type { EditorConfig } from "./types";

type AppGenericCardProps<T> = {
    item: T;
    index: number;
    editor: ItemEditorController<T>;
    config: EditorConfig<T>;
};

export default function AppGenericCard<T>({ item, index, editor, config }: AppGenericCardProps<T>) {
    const interactionsLocked = editor.isPersisting;

    return (
        <AppEditableCard
            title={config.getCardTitle(item)}
            description={config.getCardDescription?.(item)}
            meta={config.getCardMeta?.(item)}
            editAriaLabel={`Edit ${config.singularLabel}`}
            deleteAriaLabel={`Delete ${config.singularLabel}`}
            onEdit={() => editor.openEdit(index)}
            onDelete={() =>
                editor.deleteByIndices([index], `Failed to delete ${config.singularLabel}. Item was restored.`)
            }
            disabled={interactionsLocked}
            contentClassName={config.cardContentClassName}
        >
            {config.renderCardContent(item)}
        </AppEditableCard>
    );
}
