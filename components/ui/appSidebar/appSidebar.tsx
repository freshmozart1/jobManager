"use client";

import { Home, Search, LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppSidebarContent } from "./useAppSidebarContent";

type MenuItem = {
    href: string;
    tooltip: string;
    label: string;
    icon?: LucideIcon;
    isAvatar?: boolean;
};

const menuItems: MenuItem[] = [
    { href: "/personal", tooltip: "Profile", label: "Profile", isAvatar: true },
    { href: "/", tooltip: "Home", label: "Home", icon: Home },
    { href: "/search", tooltip: "Search", label: "Search", icon: Search },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { headerContent, mainContent } = useAppSidebarContent();

    return (
        <Sidebar side="left" collapsible="icon">
            {headerContent && (
                <SidebarHeader>
                    {headerContent}
                </SidebarHeader>
            )}
            <SidebarContent className="justify-center">
                {mainContent ?? (
                    <SidebarGroup>
                        <SidebarMenu>
                            {menuItems.map(({ href, tooltip, label, icon: Icon, isAvatar }) => {
                                const isActive = pathname === href;
                                return (
                                    <SidebarMenuItem key={href}>
                                        <SidebarMenuButton asChild tooltip={tooltip} isActive={isActive}>
                                            <Link
                                                href={href}
                                                onClick={(e) => isActive && e.preventDefault()}
                                            >
                                                {isAvatar ? (
                                                    <Avatar className="size-4">
                                                        <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
                                                        <AvatarFallback>CN</AvatarFallback>
                                                    </Avatar>
                                                ) : Icon && <Icon />}
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>
        </Sidebar>
    );
}
