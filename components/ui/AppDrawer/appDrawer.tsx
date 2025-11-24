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

    const { getSlot } = useAppDrawer();
    const leftContent = getSlot('left') ?? leftChild;
    const bottomContent = getSlot('bottom') ?? bottomChild;
    const rightContent = getSlot('right') ?? rightChild;


    useEffect(
        () => {
            for (const [current, setter] of [
                [leftDrawerRef.current?.offsetWidth, setLeftDrawerWidth],
                [bottomDrawerRef.current?.offsetHeight, setBottomDrawerHeight],
                [rightDrawerRef.current?.offsetWidth, setRightDrawerWidth]
            ] as [number | undefined, React.Dispatch<React.SetStateAction<number>>][]) if (current) setter(current);
        },
        [bottomDrawerRef, leftDrawerRef, rightDrawerRef, setBottomDrawerHeight, setLeftDrawerWidth, setRightDrawerWidth]
    );
    const [positions, openDrawer] = useDrawerPositions([leftChild, bottomChild, rightChild].reduce<UseDrawerPositionsProps>(
        (acc, child) => {
            if (!child) return acc;
            const position = child.props['data-position'] as DrawerPosition | undefined;
            const cmp = (l: number, r: number, b: number) => position === 'right' ? r : position === 'bottom' ? b : l;
            acc[position || 'left'] = {
                collapsedWidth: cmp(collapsedLeftDrawerWidth, collapsedRightDrawerWidth, collapsedLeftDrawerWidth),
                width: cmp(leftDrawerWidth, rightDrawerWidth, leftDrawerWidth),
                collapsedHeight: cmp(0, 0, collapsedBottomDrawerHeight),
                height: cmp(0, 0, bottomDrawerHeight),
            };
            return acc;
        },
        {}
    ));

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
            '--left': clrb(!!leftChild, positions.left, leftDrawerWidth, collapsedLeftDrawerWidth),
            '--right': clrb(!!rightChild, positions.right, rightDrawerWidth, collapsedRightDrawerWidth),
            '--bottom': clrb(!!bottomChild, positions.bottom, bottomDrawerHeight, collapsedBottomDrawerHeight),
            '--transition': transitionEnabled ?? 'none',
            '--pEvents': cpEbG ? 'auto' : 'none',
            '--bgColor': cpEbG ? 'rgba(0, 0, 0, 0.35)' : 'transparent',
            '--borderRadius': px(bottomChild ? cornerRadius : 0)
        } as CSSProperties;
    }, [bottomChild, leftChild, rightChild, leftDrawerWidth, bottomDrawerHeight, rightDrawerWidth, transitionEnabled, collapsedLeftDrawerWidth, collapsedBottomDrawerHeight, collapsedRightDrawerWidth, cornerRadius, positions, pxIf, px]);
    const drawerFactory = useCallback(
        (target: DrawerPosition) => {
            const clr = (childExists: boolean, position: number, width: number) => pxIf(childExists, position + (target === 'bottom' ? width : 0));
            return <div
                className={styles[`${target}Drawer`] + ' print:display-none'}
                ref={{ left: leftDrawerRef, bottom: bottomDrawerRef, right: rightDrawerRef }[target]}
                style={{
                    '--left': clr(!!leftChild, positions.left, leftDrawerWidth),
                    '--bottom': px(positions.bottom),
                    '--right': clr(!!rightChild, positions.right, rightDrawerWidth),
                    '--transition': transitionEnabled ?? 'none',
                    '--borderOffset': pxIf(!!bottomChild, positions.bottom < 0 ? collapsedBottomDrawerHeight + cornerRadius : bottomDrawerHeight + cornerRadius),
                    '--minWidth': px(target === 'left' ? collapsedLeftDrawerWidth : target === 'right' ? collapsedRightDrawerWidth : 0),
                    '--paddingTop': px(collapsedBottomDrawerHeight),
                    '--rightSvgSize': pxIf(!!rightChild, cornerRadius),
                    '--leftSvgSize': pxIf(!!leftChild, cornerRadius),
                } as CSSProperties}
                onClick={handleDrawerClick}
                data-target={target}
            >
                {
                    target === 'bottom' && <div className={styles.collapseBar}></div>
                }
                {
                    {
                        left: leftContent,
                        bottom: bottomContent,
                        right: rightContent
                    }[target]
                }
            </div>;
        },
        [leftChild, bottomChild, rightChild, leftContent, bottomContent, rightContent, leftDrawerRef, bottomDrawerRef, rightDrawerRef, positions, leftDrawerWidth, rightDrawerWidth, bottomDrawerHeight, collapsedLeftDrawerWidth, collapsedBottomDrawerHeight, collapsedRightDrawerWidth, cornerRadius, transitionEnabled, handleDrawerClick, px, pxIf]
    );

    return (
        <div id="appDrawerHost" style={{ width: '100%' }}>
            <style>
                {`
                    :has(> #appDrawerHost) {
                        padding-left: calc(${pxIf(!!leftChild, collapsedLeftDrawerWidth)} + var(--borderWidth));
                        padding-right: calc(${pxIf(!!rightChild, collapsedRightDrawerWidth)} + var(--borderWidth));
                        padding-bottom: calc(${pxIf(!!bottomChild, collapsedBottomDrawerHeight)} + var(--borderWidth));
                    }
                `}
            </style>
            <div
                className={styles.overlay}
                onClick={handleDrawerClick}
                data-target="initial"
                style={overlayStyleFacory}
            ></div>
            {leftChild && drawerFactory('left')}
            {bottomChild && drawerFactory('bottom')}
            {rightChild && drawerFactory('right')}
            {leftChild && bottomChild && SVGCorner('left')}
            {rightChild && bottomChild && SVGCorner('right')}
        </div>
    );
}