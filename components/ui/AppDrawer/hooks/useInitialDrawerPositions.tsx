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
                if (!child) {
                    return acc;
                }
                acc[child.props['data-position'] ?? 'left'] = collapsedSpace === space
                    ? 0
                    : collapsedSpace - space;
                if (child === bottomChild) console.log(acc, 'collapsedSpace', collapsedSpace, 'space', space);
                return acc;
            },
            {} as Record<DrawerPosition, number>
        ),
        [leftChild, bottomChild, rightChild, bottomDrawerHeight, collapsedBottomDrawerHeight, leftDrawerWidth, collapsedLeftDrawerWidth, rightDrawerWidth, collapsedRightDrawerWidth]
    );
}