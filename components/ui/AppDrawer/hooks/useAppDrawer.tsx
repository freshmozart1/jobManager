"use client";
import { useContext } from "react";
import { APP_DRAWER_CONTEXT as context } from "..";
import type { AppDrawerContext } from "..";


/**
 * Hook to access the AppDrawer context.
 *
 * @returns The AppDrawer context value.
 * @throws Error if used outside of an AppDrawerProvider.
 */
export default function useAppDrawer(): AppDrawerContext {
    const ctx: AppDrawerContext | null = useContext<AppDrawerContext | null>(context);
    if (!ctx) {
        throw new Error("useAppDrawer must be used within AppDrawerProvider");
    }
    return ctx;
}
