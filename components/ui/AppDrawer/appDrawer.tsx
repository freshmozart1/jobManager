'use client';

import { useCallback, useEffect, useMemo } from "react";
import type { CSSProperties, MouseEvent } from "react";
import {
    styles,
    useDrawerRefs,
    useStates,
    useChildren,
    useDrawerPositions,
    useAppDrawer
} from ".";
import type {
    AppDrawerProps,
    DrawerPosition,
    OpenDrawerProps,
    UseDrawerPositionsProps,
} from ".";

const DEFAULT_VISIBLE_WIDTH = 48,
    DEFAULT_VISIBLE_HEIGHT = 25;

export default function AppDrawer(
    {
        collapsedSize: {
            leftWidth: collapsedLeftDrawerWidth = DEFAULT_VISIBLE_WIDTH,
            bottomHeight: collapsedBottomDrawerHeight = DEFAULT_VISIBLE_HEIGHT,
            rightWidth: collapsedRightDrawerWidth = DEFAULT_VISIBLE_WIDTH
        } = {
            leftWidth: DEFAULT_VISIBLE_WIDTH,
            bottomHeight: DEFAULT_VISIBLE_HEIGHT,
            rightWidth: DEFAULT_VISIBLE_WIDTH
        },
        cornerRadius = 48,
        children
    }: AppDrawerProps
) {
    const [
        bottomDrawerRef,
        leftDrawerRef,
        rightDrawerRef
    ] = useDrawerRefs();
    const [
        [bottomDrawerHeight, setBottomDrawerHeight],
        [leftDrawerWidth, setLeftDrawerWidth],
        [rightDrawerWidth, setRightDrawerWidth],
        [transitionEnabled, setTransitionEnabled]
    ] = useStates();

    const [
        leftChild,
        bottomChild,
        rightChild
    ] = useChildren(children);

    const { setDrawer, left, right, bottom } = useAppDrawer();

    useEffect(() => {
        if (!left) setDrawer('left', leftChild);
        if (!bottom) setDrawer('bottom', bottomChild);
        if (!right) setDrawer('right', rightChild);
    }, [leftChild, bottomChild, rightChild, setDrawer, left, bottom, right]);

    const contentLeft = left || leftChild;
    const contentBottom = bottom || bottomChild;
    const contentRight = right || rightChild;

    useEffect(
        () => {
            for (const [current, setter] of [
                [leftDrawerRef.current?.offsetWidth, setLeftDrawerWidth],
                [bottomDrawerRef.current?.offsetHeight, setBottomDrawerHeight],
                [rightDrawerRef.current?.offsetWidth, setRightDrawerWidth]
            ] as [number | undefined, React.Dispatch<React.SetStateAction<number>>][]) if (current) setter(current);
        },
        [bottomDrawerRef, leftDrawerRef, rightDrawerRef, setBottomDrawerHeight, setLeftDrawerWidth, setRightDrawerWidth, contentLeft, contentBottom, contentRight]
    );

    const drawerConfig = useMemo(() => {
        const config: UseDrawerPositionsProps = {};
        if (contentLeft) {
            config.left = {
                collapsedWidth: collapsedLeftDrawerWidth,
                width: leftDrawerWidth,
            };
        }
        if (contentRight) {
            config.right = {
                collapsedWidth: collapsedRightDrawerWidth,
                width: rightDrawerWidth,
            };
        }
        if (contentBottom) {
            config.bottom = {
                collapsedHeight: collapsedBottomDrawerHeight,
                height: bottomDrawerHeight,
            };
        }
        return config;
    }, [contentLeft, contentRight, contentBottom, collapsedLeftDrawerWidth, leftDrawerWidth, collapsedRightDrawerWidth, rightDrawerWidth, collapsedBottomDrawerHeight, bottomDrawerHeight]);

    const [positions, openDrawer] = useDrawerPositions(drawerConfig);

    const px = useCallback((value: number) => `${value}px`, []);

    const SVGCorner = useCallback(
        (target: Omit<DrawerPosition, 'bottom'>) => {
            const clr = (p: 'left' | 'right', cw: number, w: number) => target === p
                ? positions[p] < 0
                    ? positions[p] === -Number.MAX_VALUE
                        ? -cornerRadius
                        : cw
                    : w
                : 'auto';
            return <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.corner}
                width={cornerRadius}
                height={cornerRadius}
                viewBox={`0 0 ${cornerRadius} ${cornerRadius}`}
                shapeRendering='geometricPrecision'
                clipPath={target === 'left'
                    ? `path('M 0 0 L 0 ${cornerRadius} L ${cornerRadius} ${cornerRadius} L ${cornerRadius} ${cornerRadius - 1} A ${cornerRadius - 1} ${cornerRadius - 1} 0 0 1 1 0 Z')`
                    : `path('M ${cornerRadius} 0 L ${cornerRadius} ${cornerRadius} L 0 ${cornerRadius} L 0 ${cornerRadius - 1} A ${cornerRadius - 1} ${cornerRadius - 1} 0 0 0 ${cornerRadius - 1} 0 Z')`}
                style={{
                    '--transition': transitionEnabled ?? 'none',
                    '--bottom': px(positions.bottom < 0 ? collapsedBottomDrawerHeight : bottomDrawerHeight),
                    left: clr('left', collapsedLeftDrawerWidth, leftDrawerWidth),
                    right: clr('right', collapsedRightDrawerWidth, rightDrawerWidth),
                } as CSSProperties}
            >
                <path
                    d={target === 'left'
                        ? `M 0 0 A ${cornerRadius} ${cornerRadius} 0 0 0 ${cornerRadius} ${cornerRadius} L ${cornerRadius} ${cornerRadius - 1} A ${cornerRadius - 1} ${cornerRadius - 1} 0 0 1 1 0 Z`
                        : `M ${cornerRadius} 0 A ${cornerRadius} ${cornerRadius} 0 0 1 0 ${cornerRadius} L 0 ${cornerRadius - 1} A ${cornerRadius - 1} ${cornerRadius - 1} 0 0 0 ${cornerRadius - 1} 0 Z`
                    }
                />
            </svg>;
        },
        [cornerRadius, positions, bottomDrawerHeight, collapsedBottomDrawerHeight, leftDrawerWidth, collapsedLeftDrawerWidth, rightDrawerWidth, collapsedRightDrawerWidth, transitionEnabled, px]
    );

    const handleDrawerClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setTransitionEnabled('bottom 0.3s ease-in-out, left 0.3s ease-in-out, right 0.3s ease-in-out, background-color 0.3s ease-in-out, height 0.3s ease-in-out');
        const target = e.currentTarget.getAttribute('data-target') as OpenDrawerProps;
        openDrawer(target);
    }, [openDrawer, setTransitionEnabled]);

    const pxIf = useCallback(
        (childExists: boolean, value: number) => px(childExists ? value : 0),
        [px]
    );

    const overlayStyleFacory = useMemo(() => {
        const clrb = (childExists: boolean, position: number, w: number, cw: number) => pxIf(childExists, position === 0 ? w : cw);
        const cpEbG = (positions.left === 0 || positions.right === 0 || positions.bottom === 0);
        return {
            '--left': clrb(!!contentLeft, positions.left, leftDrawerWidth, collapsedLeftDrawerWidth),
            '--right': clrb(!!contentRight, positions.right, rightDrawerWidth, collapsedRightDrawerWidth),
            '--bottom': clrb(!!contentBottom, positions.bottom, bottomDrawerHeight, collapsedBottomDrawerHeight),
            '--transition': transitionEnabled ?? 'none',
            '--pEvents': cpEbG ? 'auto' : 'none',
            '--bgColor': cpEbG ? 'rgba(0, 0, 0, 0.35)' : 'transparent',
            '--borderLeftRadius': pxIf(!!contentBottom && !!contentLeft, cornerRadius),
            '--borderRightRadius': pxIf(!!contentBottom && !!contentRight, cornerRadius),
            '--borderLeftWidth': pxIf(!!contentLeft, 1),
            '--borderRightWidth': pxIf(!!contentRight, 1),
            '--borderBottomWidth': pxIf(!!contentBottom, 1),
        } as CSSProperties;
    }, [contentBottom, contentLeft, contentRight, leftDrawerWidth, bottomDrawerHeight, rightDrawerWidth, transitionEnabled, collapsedLeftDrawerWidth, collapsedBottomDrawerHeight, collapsedRightDrawerWidth, cornerRadius, positions, pxIf]);
    const drawerFactory = useCallback(
        (target: DrawerPosition) => {
            const clr = (childExists: boolean, position: number, width: number) => pxIf(childExists, position + (target === 'bottom' ? width : 0));
            return <div
                className={styles[`${target}Drawer`] + ' print:display-none'}
                ref={{ left: leftDrawerRef, bottom: bottomDrawerRef, right: rightDrawerRef }[target]}
                style={{
                    '--left': clr(!!contentLeft, positions.left, leftDrawerWidth),
                    '--bottom': px(positions.bottom),
                    '--right': clr(!!contentRight, positions.right, rightDrawerWidth),
                    '--transition': transitionEnabled ?? 'none',
                    '--borderOffset': pxIf(!!contentBottom, positions.bottom < 0 ? collapsedBottomDrawerHeight + cornerRadius : bottomDrawerHeight + cornerRadius),
                    '--minWidth': px(target === 'left' ? collapsedLeftDrawerWidth : target === 'right' ? collapsedRightDrawerWidth : 0),
                    '--paddingTop': px(collapsedBottomDrawerHeight),
                    '--rightSvgSize': pxIf(!!contentRight, cornerRadius),
                    '--leftSvgSize': pxIf(!!contentLeft, cornerRadius),
                } as CSSProperties}
                onClick={handleDrawerClick}
                data-target={target}
            >
                {
                    target === 'bottom' && <div className={styles.collapseBar}></div>
                }
                {
                    {
                        left: contentLeft,
                        bottom: contentBottom,
                        right: contentRight
                    }[target]
                }
            </div>;
        },
        [contentLeft, contentBottom, contentRight, leftDrawerRef, bottomDrawerRef, rightDrawerRef, positions, leftDrawerWidth, rightDrawerWidth, bottomDrawerHeight, collapsedLeftDrawerWidth, collapsedBottomDrawerHeight, collapsedRightDrawerWidth, cornerRadius, transitionEnabled, handleDrawerClick, px, pxIf]
    );

    return (
        <div id="appDrawerHost" style={{ width: '100%' }}>
            <style>
                {`
                    :has(> #appDrawerHost) {
                        padding-left: calc(${pxIf(!!contentLeft, collapsedLeftDrawerWidth)} + var(--borderWidth));
                        padding-right: calc(${pxIf(!!contentRight, collapsedRightDrawerWidth)} + var(--borderWidth));
                        padding-bottom: calc(${pxIf(!!contentBottom, collapsedBottomDrawerHeight)} + var(--borderWidth));
                    }
                `}
            </style>
            <div
                className={styles.overlay}
                onClick={handleDrawerClick}
                data-target="initial"
                style={overlayStyleFacory}
            ></div>
            {contentLeft && drawerFactory('left')}
            {contentBottom && drawerFactory('bottom')}
            {contentRight && drawerFactory('right')}
            {contentLeft && contentBottom && SVGCorner('left')}
            {contentRight && contentBottom && SVGCorner('right')}
        </div>
    );
}