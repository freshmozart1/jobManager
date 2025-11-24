"use client";

import { createContext, useState, useMemo, useCallback, ReactNode } from "react";

export type DrawerPosition = "left" | "right" | "bottom";

type AppDrawerContextValue = {
    left: ReactNode | null;
    right: ReactNode | null;
    bottom: ReactNode | null;
    setDrawer: (pos: DrawerPosition, node: ReactNode | null) => void;
};

export const AppDrawerContext = createContext<AppDrawerContextValue | null>(null);

export function AppDrawerProvider({ children }: { children: ReactNode }) {
    const [drawers, setDrawers] = useState<Record<DrawerPosition, ReactNode | null>>({
        left: null,
        right: null,
        bottom: null,
    });

    const setDrawer = useCallback((pos: DrawerPosition, node: ReactNode | null) => {
        setDrawers((prev) => ({ ...prev, [pos]: node }));
    }, []);

    const value = useMemo<AppDrawerContextValue>(
        () => ({
            left: drawers.left,
            right: drawers.right,
            bottom: drawers.bottom,
            setDrawer,
        }),
        [drawers, setDrawer]
    );

    return (
        <AppDrawerContext.Provider value={value}>
            {children}
        </AppDrawerContext.Provider>
    );
}