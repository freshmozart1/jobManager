'use client';

import { COLLAPSE_BAR_HEIGHT, COLLAPSE_BAR_BLOCK_MARGIN, COLLAPSED_BOTTOM_VISIBLE_HEIGHT, COLLAPSED_LEFT_VISIBLE_WIDTH, COLLAPSED_RIGHT_VISIBLE_WIDTH, px, SVG_SIZE, type DrawerChildElement } from "@/components/ui/AppDrawer/appDrawer";
import { useCallback, useMemo, type CSSProperties } from "react";

const TRANSITION = '0.3s ease-in-out',
    LEFT_TRANSITION = 'left ' + TRANSITION,
    RIGHT_TRANSITION = 'right ' + TRANSITION,
    BOTTOM_TRANSITION = 'bottom ' + TRANSITION + ', ' + LEFT_TRANSITION + ', ' + RIGHT_TRANSITION,
    OVERLAY_TRANSITION = 'background-color ' + TRANSITION + ', ' + BOTTOM_TRANSITION;

export default function useStyles(
    transitionEnabled: boolean,
    dynamicLeft: number,
    dynamicBottom: number,
    dynamicRight: number,
    bottom: number,
    left: number,
    right: number,
    bottomDrawerHeight: number,
    leftChild: DrawerChildElement | undefined,
    bottomChild: DrawerChildElement | undefined,
    rightChild: DrawerChildElement | undefined
): [
        CSSProperties | undefined,
        CSSProperties,
        CSSProperties | undefined,
        (target: 'left' | 'right') => CSSProperties,
        CSSProperties
    ] {
    const anyDrawerOpen = useMemo(
        () => left === 0 || bottom === 0 || right === 0,
        [left, bottom, right]
    );
    return [
        useMemo(
            () => bottomChild
                ? {
                    position: 'fixed',
                    bottom: dynamicBottom,
                    transition: transitionEnabled ? BOTTOM_TRANSITION : 'none',
                } satisfies CSSProperties
                : undefined,
            [dynamicBottom, transitionEnabled, bottomChild]
        ),
        useMemo(
            () => ({
                '--left': px(dynamicLeft),
                '--bottom': px(dynamicBottom),
                '--right': px(dynamicRight),
                '--bgColor': anyDrawerOpen ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                '--transition': transitionEnabled ? OVERLAY_TRANSITION : 'none',
                '--borderLeftRadius': px(leftChild && bottomChild ? SVG_SIZE : 0),
                '--borderRightRadius': px(rightChild && bottomChild ? SVG_SIZE : 0),
                '--pEvents': anyDrawerOpen ? 'all' : 'none',
            }) as CSSProperties,
            [dynamicLeft, dynamicBottom, dynamicRight, anyDrawerOpen, transitionEnabled, leftChild, bottomChild, rightChild]
        ),
        useMemo(
            () => bottomChild
                ? {
                    '--bottom': px(bottom),
                    '--left': px(dynamicLeft),
                    '--right': px(dynamicRight),
                    '--transition': transitionEnabled ? BOTTOM_TRANSITION : 'none',
                    '--padding': px(COLLAPSED_BOTTOM_VISIBLE_HEIGHT),
                    '--rightSvgSize': px(rightChild ? SVG_SIZE : 0),
                    '--leftSvgSize': px(leftChild ? SVG_SIZE : 0),
                } as CSSProperties
                : undefined,
            [bottom, dynamicLeft, dynamicRight, transitionEnabled, bottomChild, leftChild, rightChild]
        ),
        useCallback(
            (target: 'left' | 'right') => {
                return {
                    ...(
                        target === 'left'
                            ? {
                                '--left': px(left),
                                '--transition':
                                    transitionEnabled
                                        ? LEFT_TRANSITION
                                        : 'none'
                            }
                            : {
                                '--right': px(right),
                                '--transition':
                                    transitionEnabled
                                        ? RIGHT_TRANSITION
                                        : 'none'
                            } as CSSProperties
                    ) as CSSProperties,
                    '--borderOffset': px(
                        bottomChild
                            ? (
                                bottom < 0
                                    ? COLLAPSED_BOTTOM_VISIBLE_HEIGHT
                                    : bottomDrawerHeight
                            ) + SVG_SIZE
                            : 0
                    ),
                    '--minWidth': px(
                        target === 'left'
                            ? COLLAPSED_LEFT_VISIBLE_WIDTH
                            : COLLAPSED_RIGHT_VISIBLE_WIDTH
                    ),
                } as CSSProperties;
            },
            [bottom, left, right, bottomDrawerHeight, transitionEnabled, bottomChild]
        ),
        useMemo(() => ({
            width: px(40),
            height: px(COLLAPSE_BAR_HEIGHT),
            backgroundColor: 'grey',
            borderRadius: px(5),
            position: 'absolute',
            top: px(COLLAPSE_BAR_BLOCK_MARGIN),
        }), [])
    ];
}