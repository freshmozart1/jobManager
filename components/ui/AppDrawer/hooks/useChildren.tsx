'use client';

import { DrawerChildElement, DrawerPosition } from "@/components/ui/AppDrawer/appDrawer";
import { useMemo } from "react";

export default function useChildren(children: DrawerChildElement | DrawerChildElement[]) {
    const {
        left: leftChild,
        bottom: bottomChild,
        right: rightChild
    } = useMemo(
        () => (
            Array.isArray(children)
                ? children
                : [children]
        ).reduce(
            (acc, child) => {
                acc[child.props['data-position'] ?? 'left'] = child;
                return acc;
            },
            {} as Partial<Record<DrawerPosition, DrawerChildElement>>
        ),
        [children]
    );
    return [leftChild, bottomChild, rightChild];
}