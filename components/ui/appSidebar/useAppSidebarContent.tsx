"use client";

import { createContext, useContext, type ReactNode } from "react";

export type BackAction = {
    onClick: () => void;
    label: string;
} | null;

type AppSidebarContentContextType = {
    headerContent: ReactNode;
    mainContent: ReactNode;
    backAction: BackAction;
    setHeaderContent: (content: ReactNode) => void;
    setMainContent: (content: ReactNode) => void;
    setBackAction: (action: BackAction) => void;
};

export const AppSidebarContentContext = createContext<AppSidebarContentContextType | null>(null);

export function useAppSidebarContent(): AppSidebarContentContextType {
    const context = useContext(AppSidebarContentContext);
    if (!context) {
        throw new Error("useAppSidebarContent must be used within AppSidebarContentProvider");
    }
    return context;
}
