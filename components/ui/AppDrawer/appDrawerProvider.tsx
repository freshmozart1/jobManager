"use client";

import { createContext, useState, useMemo, ReactNode } from "react";

export type DrawerPosition = "left" | "right" | "bottom";

type AppDrawerContextValue = {
    setSlot: (pos: DrawerPosition, node: ReactNode | null) => void;
    getSlot: (pos: DrawerPosition) => ReactNode | null;
};

export const AppDrawerContext = createContext<AppDrawerContextValue | null>(null);

export function AppDrawerProvider({ children }: { children: ReactNode }) {
    const [slots, setSlots] = useState<Record<DrawerPosition, ReactNode | null>>({
        left: null,
        right: null,
        bottom: null,
    });

    const value = useMemo<AppDrawerContextValue>(
        () => ({
            setSlot: (pos, node) =>
                setSlots((prev) => ({ ...prev, [pos]: node })),
            getSlot: (pos) => slots[pos],
        }),
        [slots]
    );

    return (
        <AppDrawerContext.Provider value={value}>
            {children}
        </AppDrawerContext.Provider>
    );
}