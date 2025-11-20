'use client';

import {
    type DrawerChildElement,
    type DrawerPosition
} from '@/components/ui/AppDrawer/appDrawer';
import { useMemo } from 'react';

export default function useInitialDrawerPositions(
    leftChild: DrawerChildElement | undefined,
    bottomChild: DrawerChildElement | undefined,
    rightChild: DrawerChildElement | undefined,
    leftDrawerWidth: number,
    collapsedLeftDrawerWidth: number,
    bottomDrawerHeight: number,
    collapsedBottomDrawerHeight: number,
    rightDrawerWidth: number,
    collapsedRightDrawerWidth: number
) {
    return useMemo(
        () => ([
            [leftChild, collapsedLeftDrawerWidth, leftDrawerWidth],
            [bottomChild, collapsedBottomDrawerHeight, bottomDrawerHeight],
            [rightChild, collapsedRightDrawerWidth, rightDrawerWidth]
        ] as Array<[DrawerChildElement | undefined, number, number]>).reduce(
            (acc, [child, collapsedSpace, space]) => {
                acc[(child?.props['data-position'] ?? 'left')] = child ? collapsedSpace - space : -space - 1;
                return acc;
            },
            {} as Record<DrawerPosition, number>
        ),
        [leftChild, bottomChild, rightChild, bottomDrawerHeight, collapsedBottomDrawerHeight, leftDrawerWidth, collapsedLeftDrawerWidth, rightDrawerWidth, collapsedRightDrawerWidth]
    );
}