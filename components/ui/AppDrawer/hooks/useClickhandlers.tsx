'use client';

import { DrawerPosition } from "@/components/ui/AppDrawer/appDrawer";
import { Dispatch, SetStateAction, useCallback, type MouseEvent as ReactMouseEvent } from "react";

export default function useClickHandlers(
    collapsedBottom: number,
    collapsedLeft: number,
    collapsedRight: number,
    initialDrawerPositions: Record<DrawerPosition, number>,
    setTransitionEnabled: Dispatch<SetStateAction<boolean>>,
    setBottom: Dispatch<SetStateAction<number>>,
    setLeft: Dispatch<SetStateAction<number>>,
    setRight: Dispatch<SetStateAction<number>>
): [
        (target: DrawerPosition) => (event: ReactMouseEvent<HTMLDivElement>) => void,
        (event: ReactMouseEvent<HTMLDivElement>) => void
    ] {
    return [
        useCallback(
            (target: DrawerPosition) => (
                event: ReactMouseEvent<HTMLDivElement>
            ) => {
                event.preventDefault();
                setTransitionEnabled(true);
                const setters = { bottom: setBottom, left: setLeft, right: setRight };
                (Object.keys(setters) as Array<'bottom' | 'left' | 'right'>).forEach((key) => {
                    if (key === target) {
                        setters[key](
                            prev =>
                                prev === 0
                                    ? { bottom: collapsedBottom, left: collapsedLeft, right: collapsedRight }[key]
                                    : 0
                        );
                    } else {
                        setters[key](initialDrawerPositions[key]);
                    }
                });
            },
            [collapsedBottom, collapsedLeft, collapsedRight, initialDrawerPositions, setBottom, setLeft, setRight, setTransitionEnabled]
        ),
        useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
            event.preventDefault();
            setTransitionEnabled(true);
            const { left, bottom, right } = initialDrawerPositions;
            setLeft(left);
            setBottom(bottom);
            setRight(right);
        }, [initialDrawerPositions, setBottom, setLeft, setRight, setTransitionEnabled])
    ];
}