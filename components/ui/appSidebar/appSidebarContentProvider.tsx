"use client";

import { useState, useCallback, type ReactNode } from "react";
import { AppSidebarContentContext, type BackAction } from "./useAppSidebarContent";

type AppSidebarContentProviderProps = {
    children: ReactNode;
};

export function AppSidebarContentProvider({ children }: AppSidebarContentProviderProps) {
    const [headerContent, setHeaderContentState] = useState<ReactNode>(null);
    const [mainContent, setMainContentState] = useState<ReactNode>(null);
    const [backAction, setBackActionState] = useState<BackAction>(null);

    const setHeaderContent = useCallback((content: ReactNode) => {
        setHeaderContentState(content);
    }, []);

    const setMainContent = useCallback((content: ReactNode) => {
        setMainContentState(content);
    }, []);

    const setBackAction = useCallback((action: BackAction) => {
        setBackActionState(action);
    }, []);

    return (
        <AppSidebarContentContext.Provider value={{ headerContent, mainContent, backAction, setHeaderContent, setMainContent, setBackAction }}>
            {children}
        </AppSidebarContentContext.Provider>
    );
}
