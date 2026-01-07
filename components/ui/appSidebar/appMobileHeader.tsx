"use client";

import { ArrowLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppSidebarContent } from "./useAppSidebarContent";
import { Button } from "@/components/ui/button";

export function AppMobileHeader() {
    const { backAction } = useAppSidebarContent();

    if (backAction) {
        return (
            <header className="flex h-12 items-center px-4 md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={backAction.onClick}
                    aria-label={backAction.label}
                >
                    <ArrowLeft className="size-4" />
                </Button>
            </header>
        );
    }

    return (
        <header className="flex h-12 items-center px-4 md:hidden">
            <SidebarTrigger />
        </header>
    );
}
