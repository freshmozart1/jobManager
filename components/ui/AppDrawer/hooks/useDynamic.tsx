'use client';

import { useMemo } from "react";
import { DrawerChildElement, COLLAPSED_BOTTOM_VISIBLE_HEIGHT, COLLAPSED_LEFT_VISIBLE_WIDTH, VIEWPORT_WIDTH, COLLAPSED_RIGHT_VISIBLE_WIDTH } from "@/components/ui/AppDrawer/appDrawer";

const VIEWPORT_HEIGHT = typeof window === "undefined" ? 0 : window.innerHeight;

function calcDynamicOffset(
    child: DrawerChildElement | undefined,
    positionValue: number,
    collapsedSize: number,
    drawerSize: number,
    viewportSize: number
) {
    return child
        ? positionValue < 0
            ? collapsedSize
            : drawerSize < viewportSize
                ? drawerSize
                : 0
        : 0;
}

export default function useDynamic(
    bottomChild: DrawerChildElement | undefined,
    bottom: number,
    bottomDrawerHeight: number,
    leftChild: DrawerChildElement | undefined,
    left: number,
    leftDrawerWidth: number,
    rightChild: DrawerChildElement | undefined,
    right: number,
    rightDrawerWidth: number) {
    return [
        useMemo(
            () => calcDynamicOffset(bottomChild, bottom, COLLAPSED_BOTTOM_VISIBLE_HEIGHT, bottomDrawerHeight, VIEWPORT_HEIGHT),
            [bottomChild, bottom, bottomDrawerHeight]
        ),
        useMemo(
            () => calcDynamicOffset(leftChild, left, COLLAPSED_LEFT_VISIBLE_WIDTH, leftDrawerWidth, VIEWPORT_WIDTH),
            [leftChild, left, leftDrawerWidth]
        ),
        useMemo(
            () => calcDynamicOffset(rightChild, right, COLLAPSED_RIGHT_VISIBLE_WIDTH, rightDrawerWidth, VIEWPORT_WIDTH),
            [rightChild, right, rightDrawerWidth]
        )
    ];
}