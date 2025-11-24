'use client';

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { DrawerPosition, DrawerPositions, OpenDrawerProps, UseDrawerPositionsProps } from "..";

export default function useDrawerPositions({ left, bottom, right }: UseDrawerPositionsProps): [DrawerPositions, (target: OpenDrawerProps) => void] {
    const calcInitial = useCallback(
        (exists: boolean, c: number | undefined, s: number | undefined) => exists
            ? c === s
                ? 0
                : c! - s!
            : -Number.MAX_VALUE,
        []
    )
    const initial = useMemo<DrawerPositions>(() => ({
        left: calcInitial(!!left, left?.collapsedWidth, left?.width),
        bottom: calcInitial(!!bottom, bottom?.collapsedHeight, bottom?.height),
        right: calcInitial(!!right, right?.collapsedWidth, right?.width),
    }), [left, bottom, right, calcInitial]);

    const [position, openDrawer] = useReducer((currentPosition: Record<DrawerPosition, number>, target: OpenDrawerProps) => {
        switch (target) {
            case 'left': return { bottom: initial.bottom, left: currentPosition.left === 0 ? initial.left : 0, right: initial.right };
            case 'bottom': return { bottom: currentPosition.bottom === 0 ? initial.bottom : 0, left: initial.left, right: initial.right };
            case 'right': return { bottom: initial.bottom, left: initial.left, right: currentPosition.right === 0 ? initial.right : 0 };
            case 'initial': return { bottom: initial.bottom, left: initial.left, right: initial.right };
        }
    }, {
        bottom: initial.bottom,
        left: initial.left,
        right: initial.right
    });

    useEffect(
        () => openDrawer('initial'),
        [openDrawer, initial]
    );

    return [position, openDrawer];
}