"use client";

import { useState, useCallback, type ReactNode } from "react";
import { AppSidebarContentContext } from "./useAppSidebarContent";

type AppSidebarContentProviderProps = {
    children: ReactNode;
};

export function AppSidebarContentProvider({ children }: AppSidebarContentProviderProps) {
    const [headerContent, setHeaderContentState] = useState<ReactNode>(null);
    const [mainContent, setMainContentState] = useState<ReactNode>(null);

    const setHeaderContent = useCallback((content: ReactNode) => {
        setHeaderContentState(content);
    }, []);

    const setMainContent = useCallback((content: ReactNode) => {
        setMainContentState(content);
    }, []);

    return (
        <AppSidebarContentContext.Provider value={{ headerContent, mainContent, setHeaderContent, setMainContent }}>
            {children}
        </AppSidebarContentContext.Provider>
    );
}
