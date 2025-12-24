"use client";

import { ReactNode } from "react";

import { useItemEditor, type ItemEditorController, type UseItemEditorOptions } from "./useItemEditor";

type AppItemEditorProps<TItem> = UseItemEditorOptions<TItem> & {
    children: (editor: ItemEditorController<TItem>) => ReactNode;
};

export function AppItemEditor<TItem>({ children, ...options }: AppItemEditorProps<TItem>) {
    const editor = useItemEditor<TItem>(options);
    return <>{children(editor)}</>;
}
