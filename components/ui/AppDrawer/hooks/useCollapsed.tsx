'use client';

import { useMemo } from "react";
import { COLLAPSED_BOTTOM_VISIBLE_HEIGHT, COLLAPSED_LEFT_VISIBLE_WIDTH, COLLAPSED_RIGHT_VISIBLE_WIDTH } from "@/components/ui/AppDrawer/appDrawer";

export default function useCollapsed(bottomDrawerHeight: number, leftDrawerWidth: number, rightDrawerWidth: number) {
    return [useMemo(
        () => COLLAPSED_BOTTOM_VISIBLE_HEIGHT - bottomDrawerHeight,
        [bottomDrawerHeight]
    ), useMemo(
        () => COLLAPSED_LEFT_VISIBLE_WIDTH - leftDrawerWidth,
        [leftDrawerWidth]
    ),
    useMemo(
        () => COLLAPSED_RIGHT_VISIBLE_WIDTH - rightDrawerWidth,
        [rightDrawerWidth]
    )];
}