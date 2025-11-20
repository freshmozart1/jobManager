'use client';

import {
    COLLAPSED_LEFT_VISIBLE_WIDTH,
    COLLAPSED_RIGHT_VISIBLE_WIDTH,
    COLLAPSED_BOTTOM_VISIBLE_HEIGHT,
    type DrawerChildElement,
    type DrawerPosition
} from '@/components/ui/AppDrawer/appDrawer';
import { useMemo } from 'react';

export default function useInitialDrawerPositions(
    leftChild: DrawerChildElement | undefined,
    bottomChild: DrawerChildElement | undefined,
    rightChild: DrawerChildElement | undefined,
    leftDrawerWidth: number,
    bottomDrawerHeight: number,
    rightDrawerWidth: number
) {
    return useMemo(
        () => ([
            [leftChild, COLLAPSED_LEFT_VISIBLE_WIDTH, leftDrawerWidth],
            [bottomChild, COLLAPSED_BOTTOM_VISIBLE_HEIGHT, bottomDrawerHeight],
            [rightChild, COLLAPSED_RIGHT_VISIBLE_WIDTH, rightDrawerWidth]
        ] as Array<[DrawerChildElement | undefined, number, number]>).reduce(
            (acc, [child, collapsedSpace, space]) => {
                acc[(child?.props['data-position'] ?? 'left')] = child ? collapsedSpace - space : -space - 1;
                return acc;
            },
            {} as Record<DrawerPosition, number>
        ),
        [leftChild, bottomChild, rightChild, bottomDrawerHeight, leftDrawerWidth, rightDrawerWidth]
    );
}