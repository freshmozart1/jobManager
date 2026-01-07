"use client";

import { createContext, useContext, type ReactNode } from "react";

type AppSidebarContentContextType = {
    headerContent: ReactNode;
    mainContent: ReactNode;
    setHeaderContent: (content: ReactNode) => void;
    setMainContent: (content: ReactNode) => void;
};

export const AppSidebarContentContext = createContext<AppSidebarContentContextType | null>(null);

export function useAppSidebarContent(): AppSidebarContentContextType {
    const context = useContext(AppSidebarContentContext);
    if (!context) {
        throw new Error("useAppSidebarContent must be used within AppSidebarContentProvider");
    }
    return context;
}
