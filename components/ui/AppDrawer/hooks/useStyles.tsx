'use client';

import { COLLAPSE_BAR_HEIGHT, COLLAPSE_BAR_BLOCK_MARGIN, px, type DrawerChildElement } from "@/components/ui/AppDrawer/appDrawer";
import { useCallback, useMemo, type CSSProperties } from "react";

const TRANSITION = '0.3s ease-in-out',
    LEFT_TRANSITION = 'left ' + TRANSITION,
    RIGHT_TRANSITION = 'right ' + TRANSITION,
    BOTTOM_TRANSITION = 'bottom ' + TRANSITION + ', ' + LEFT_TRANSITION + ', ' + RIGHT_TRANSITION,
    OVERLAY_TRANSITION = 'background-color ' + TRANSITION + ', ' + BOTTOM_TRANSITION;

export default function useStyles(
    transitionEnabled: boolean,
    dynamicLeft: number,
    collapsedLeftDrawerWidth: number,
    dynamicBottom: number,
    collapsedBottomDrawerHeight: number,
    dynamicRight: number,
    collapsedRightDrawerWidth: number,
    bottom: number,
    left: number,
    right: number,
    leftDrawerWidth: number,
    bottomDrawerHeight: number,
    rightDrawerWidth: number,
    cornerRadius: number,
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
        () => leftDrawerWidth !== collapsedLeftDrawerWidth && left === 0 || bottomDrawerHeight !== collapsedBottomDrawerHeight && bottom === 0 || rightDrawerWidth !== collapsedRightDrawerWidth && right === 0,
        [left, bottom, right, leftDrawerWidth, collapsedLeftDrawerWidth, bottomDrawerHeight, collapsedBottomDrawerHeight, rightDrawerWidth, collapsedRightDrawerWidth]
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
                '--borderLeftRadius': px(leftChild && bottomChild ? cornerRadius : 0),
                '--borderRightRadius': px(rightChild && bottomChild ? cornerRadius : 0),
                '--pEvents': anyDrawerOpen ? 'all' : 'none',
            }) as CSSProperties,
            [dynamicLeft, dynamicBottom, dynamicRight, anyDrawerOpen, transitionEnabled, leftChild, bottomChild, rightChild, cornerRadius]
        ),
        useMemo(
            () => bottomChild
                ? {
                    '--bottom': px(bottom),
                    '--left': px(dynamicLeft),
                    '--right': px(dynamicRight),
                    '--transition': transitionEnabled ? BOTTOM_TRANSITION : 'none',
                    '--padding': px(COLLAPSE_BAR_HEIGHT + 2 * COLLAPSE_BAR_BLOCK_MARGIN),
                    '--rightSvgSize': px(rightChild ? cornerRadius : 0),
                    '--leftSvgSize': px(leftChild ? cornerRadius : 0),
                } as CSSProperties
                : undefined,
            [bottom, dynamicLeft, dynamicRight, transitionEnabled, bottomChild, leftChild, rightChild, cornerRadius]
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
                                    ? collapsedBottomDrawerHeight
                                    : bottomDrawerHeight
                            ) + cornerRadius
                            : 0
                    ),
                    '--minWidth': px(
                        target === 'left'
                            ? collapsedLeftDrawerWidth
                            : collapsedRightDrawerWidth
                    ),
                } as CSSProperties;
            },
            [bottom, left, right, bottomDrawerHeight, transitionEnabled, bottomChild, collapsedLeftDrawerWidth, collapsedRightDrawerWidth, collapsedBottomDrawerHeight, cornerRadius]
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