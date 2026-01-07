"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppSidebarContent } from "@/components/ui/appSidebar";
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

export function useSidebarBack(onClick: () => void, label: string = "Back"): void {
    const { setHeaderContent, setBackAction } = useAppSidebarContent();

    useEffect(() => {
        setHeaderContent(
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip={label} onClick={onClick}>
                        <ArrowLeft />
                        <span>{label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
        setBackAction({ onClick, label });

        return () => {
            setHeaderContent(null);
            setBackAction(null);
        };
    }, [onClick, label, setHeaderContent, setBackAction]);
}
