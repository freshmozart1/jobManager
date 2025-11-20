'use client';

import { useMemo } from "react";
import { DrawerChildElement, VIEWPORT_WIDTH } from "@/components/ui/AppDrawer/appDrawer";

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
    collapsedBottomDrawerHeight: number,
    leftChild: DrawerChildElement | undefined,
    left: number,
    leftDrawerWidth: number,
    collapsedLeftDrawerWidth: number,
    rightChild: DrawerChildElement | undefined,
    right: number,
    rightDrawerWidth: number,
    collapsedRightDrawerWidth: number) {
    return [
        useMemo(
            () => calcDynamicOffset(bottomChild, bottom, collapsedBottomDrawerHeight, bottomDrawerHeight, VIEWPORT_HEIGHT),
            [bottomChild, bottom, bottomDrawerHeight, collapsedBottomDrawerHeight]
        ),
        useMemo(
            () => calcDynamicOffset(leftChild, left, collapsedLeftDrawerWidth, leftDrawerWidth, VIEWPORT_WIDTH),
            [leftChild, left, leftDrawerWidth, collapsedLeftDrawerWidth]
        ),
        useMemo(
            () => calcDynamicOffset(rightChild, right, collapsedRightDrawerWidth, rightDrawerWidth, VIEWPORT_WIDTH),
            [rightChild, right, rightDrawerWidth, collapsedRightDrawerWidth]
        )
    ];
}