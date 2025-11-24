"use client";
import { useContext } from "react";
import { AppDrawerContext } from "..";


export default function useAppDrawer() {
    const ctx = useContext(AppDrawerContext);
    if (!ctx) {
        throw new Error("useAppDrawer must be used within AppDrawerProvider");
    }
    return ctx;
}
