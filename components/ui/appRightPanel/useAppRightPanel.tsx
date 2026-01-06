"use client";

import { createContext, useContext, type ReactNode } from "react";

type AppRightPanelContextType = {
    isOpen: boolean;
    content: ReactNode;
    openPanel: (content: ReactNode) => void;
    closePanel: () => void;
};

export const AppRightPanelContext = createContext<AppRightPanelContextType | null>(null);

export function useAppRightPanel(): AppRightPanelContextType {
    const context = useContext(AppRightPanelContext);
    if (!context) {
        throw new Error("useAppRightPanel must be used within AppRightPanelProvider");
    }
    return context;
}
