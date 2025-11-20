'use client';

import { useMemo } from "react";

export default function useCollapsed(
    bottomDrawerHeight: number,
    collapsedBottomDrawerHeight: number,
    leftDrawerWidth: number,
    collapsedLeftDrawerWidth: number,
    rightDrawerWidth: number,
    collapsedRightDrawerWidth: number
) {
    return [useMemo(
        () => collapsedBottomDrawerHeight - bottomDrawerHeight,
        [bottomDrawerHeight, collapsedBottomDrawerHeight]
    ), useMemo(
        () => collapsedLeftDrawerWidth - leftDrawerWidth,
        [leftDrawerWidth, collapsedLeftDrawerWidth]
    ),
    useMemo(
        () => collapsedRightDrawerWidth - rightDrawerWidth,
        [rightDrawerWidth, collapsedRightDrawerWidth]
    )];
}