'use client';

import { useEffect } from "react";
import type { ReactElement, CSSProperties } from "react";
import styles from "@/components/ui/AppDrawer/appDrawer.module.css";
import useDynamic from "@/components/ui/AppDrawer/hooks/useDynamic";
import useCollapsed from "@/components/ui/AppDrawer/hooks/useCollapsed";
import useStyles from "@/components/ui/AppDrawer/hooks/useStyles";
import useClickHandlers from "@/components/ui/AppDrawer/hooks/useClickhandlers";
import useDrawerRefs from "@/components/ui/AppDrawer/hooks/useDrawerRefs";
import useStates from "@/components/ui/AppDrawer/hooks/useStates";
import useChildren from "@/components/ui/AppDrawer/hooks/useChildren";
import useSVGCorner from "@/components/ui/AppDrawer/hooks/useSVGCorner";
import useInitialDrawerPositions from "./hooks/useInitialDrawerPositions";

export type DrawerPosition = 'left' | 'bottom' | 'right';
export type DrawerChildElement = ReactElement<{ 'data-position'?: DrawerPosition }>;

export function px(value: number): string {
    return `${value}px`;
}

export const VIEWPORT_WIDTH =
    typeof window === "undefined"
        ? 0
        : window.innerWidth;
export const COLLAPSE_BAR_HEIGHT = 5,
    COLLAPSE_BAR_BLOCK_MARGIN = 10;
const COLLAPSED_LEFT_VISIBLE_WIDTH = 48,
    COLLAPSED_RIGHT_VISIBLE_WIDTH = 48,
    COLLAPSED_BOTTOM_VISIBLE_HEIGHT = COLLAPSE_BAR_HEIGHT + 2 * COLLAPSE_BAR_BLOCK_MARGIN;

export default function AppDrawer(
    {
        collapsedSize: {
            leftWidth: collapsedLeftDrawerWidth,
            bottomHeight: collapsedBottomDrawerHeight,
            rightWidth: collapsedRightDrawerWidth
        } = {
            leftWidth: COLLAPSED_LEFT_VISIBLE_WIDTH,
            bottomHeight: COLLAPSED_BOTTOM_VISIBLE_HEIGHT,
            rightWidth: COLLAPSED_RIGHT_VISIBLE_WIDTH
        },
        cornerRadius = 48,
        children
    }: {
        collapsedSize?: { leftWidth: number, bottomHeight: number, rightWidth: number },
        cornerRadius?: number,
        children: DrawerChildElement | DrawerChildElement[]
    }
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
        [bottom, setBottom],
        [left, setLeft],
        [right, setRight],
        [transitionEnabled, setTransitionEnabled]
    ] = useStates();
    const [
        leftChild,
        bottomChild,
        rightChild
    ] = useChildren(children);
    const [
        collapsedBottom,
        collapsedLeft,
        collapsedRight
    ] = useCollapsed(
        bottomDrawerHeight,
        collapsedBottomDrawerHeight,
        leftDrawerWidth,
        collapsedLeftDrawerWidth,
        rightDrawerWidth,
        collapsedRightDrawerWidth
    );

    const initialDrawerPositions = useInitialDrawerPositions(
        leftChild,
        bottomChild,
        rightChild,
        leftDrawerWidth,
        collapsedLeftDrawerWidth,
        bottomDrawerHeight,
        collapsedBottomDrawerHeight,
        rightDrawerWidth,
        collapsedRightDrawerWidth
    );

    const [
        dynamicBottom,
        dynamicLeft,
        dynamicRight
    ] = useDynamic(
        bottomChild,
        bottom,
        bottomDrawerHeight,
        collapsedBottomDrawerHeight,
        leftChild,
        left,
        leftDrawerWidth,
        collapsedLeftDrawerWidth,
        rightChild,
        right,
        rightDrawerWidth,
        collapsedRightDrawerWidth
    );
    const [
        svgStyle,
        overlayStyle,
        bottomDrawerStyle,
        sideDrawerStyle,
        collapseHandleStyle
    ] = useStyles(
        transitionEnabled,
        dynamicLeft,
        collapsedLeftDrawerWidth,
        dynamicBottom,
        collapsedBottomDrawerHeight,
        dynamicRight,
        collapsedRightDrawerWidth,
        bottom,
        left,
        right,
        bottomDrawerHeight,
        cornerRadius,
        leftChild,
        bottomChild,
        rightChild
    );

    const [
        handleDrawerClick,
        handleOverlayClick
    ] = useClickHandlers(
        collapsedBottom,
        collapsedLeft,
        collapsedRight,
        initialDrawerPositions,
        setTransitionEnabled,
        setBottom,
        setLeft,
        setRight
    );

    const SVGCorner = useSVGCorner(
        left,
        right,
        collapsedLeft,
        collapsedRight,
        leftDrawerWidth,
        rightDrawerWidth,
        cornerRadius,
        svgStyle
    );

    useEffect(
        () => {
            if (bottomDrawerRef.current) setBottomDrawerHeight(bottomDrawerRef.current.offsetHeight);
            if (leftDrawerRef.current) setLeftDrawerWidth(leftDrawerRef.current.offsetWidth);
            if (rightDrawerRef.current) setRightDrawerWidth(rightDrawerRef.current.offsetWidth);
            setBottom(initialDrawerPositions.bottom);
            setLeft(initialDrawerPositions.left);
            setRight(initialDrawerPositions.right);
        },
        [initialDrawerPositions, bottomDrawerRef, leftDrawerRef, rightDrawerRef, setBottom, setLeft, setRight, setBottomDrawerHeight, setLeftDrawerWidth, setRightDrawerWidth]
    );

    return (
        <div id="appDrawerHost" style={{ width: '100%' }}>
            <style>
                {`
                    :has(> #appDrawerHost) {
                        padding-left: ${leftChild ? px(COLLAPSED_LEFT_VISIBLE_WIDTH) : '0'};
                        padding-right: ${rightChild ? px(COLLAPSED_RIGHT_VISIBLE_WIDTH) : '0'};
                        padding-bottom: ${bottomChild ? px(COLLAPSED_BOTTOM_VISIBLE_HEIGHT) : '0'};
                    }
                `}
            </style>
            <div
                style={overlayStyle}
                className={styles.overlay}
                onClick={handleOverlayClick}
            ></div>
            <div
                className={styles.leftDrawer}
                ref={leftDrawerRef}
                style={sideDrawerStyle('left') as CSSProperties}
                onClick={handleDrawerClick('left')}
            >
                {leftChild}
            </div>
            {rightChild && (
                <div
                    ref={rightDrawerRef}
                    className={styles.rightDrawer}
                    style={sideDrawerStyle('right') as CSSProperties}
                    onClick={handleDrawerClick('right')}
                >
                    {rightChild}
                </div>
            )}
            {bottomChild && (
                <div
                    ref={bottomDrawerRef}
                    className={`${styles.bottomDrawer} print:display-none`}
                    style={bottomDrawerStyle}
                    onClick={handleDrawerClick('bottom')}
                >
                    <div style={collapseHandleStyle}></div>
                    {bottomChild}
                </div>
            )}
            {leftChild && bottomChild && SVGCorner('bottom_left')}
            {rightChild && bottomChild && SVGCorner('bottom_right')}
        </div>
    );
}