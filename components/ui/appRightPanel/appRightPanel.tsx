"use client";

import { useState, useCallback, type ReactNode } from "react";
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet";
import { AppRightPanelContext } from "./useAppRightPanel";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type AppRightPanelProviderProps = {
    children: ReactNode;
};

export function AppRightPanelProvider({ children }: AppRightPanelProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState<ReactNode>(null);

    const openPanel = useCallback((newContent: ReactNode) => {
        setContent(newContent);
        setIsOpen(true);
    }, []);

    const closePanel = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) {
            closePanel();
        }
    }, [closePanel]);

    return (
        <AppRightPanelContext.Provider value={{ isOpen, content, openPanel, closePanel }}>
            {children}
            <Sheet open={isOpen} onOpenChange={handleOpenChange}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                    <VisuallyHidden>
                        <SheetTitle>Edit Panel</SheetTitle>
                    </VisuallyHidden>
                    {content}
                </SheetContent>
            </Sheet>
        </AppRightPanelContext.Provider>
    );
}
