'use client';

import { JSX, useCallback, type CSSProperties } from "react";
import { SVG_SIZE, VIEWPORT_WIDTH } from "@/components/ui/AppDrawer/appDrawer";

export default function useSVGCorner(
    left: number,
    right: number,
    collapsedLeft: number,
    collapsedRight: number,
    leftDrawerWidth: number,
    rightDrawerWidth: number,
    svgStyle?: CSSProperties
): (target: "bottom_left" | "bottom_right") => JSX.Element {
    return useCallback(
        (target: 'bottom_left' | 'bottom_right') =>
            <svg
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                style={{
                    ...svgStyle,
                    left: target === 'bottom_left'
                        ? left < 0
                            ? collapsedLeft + leftDrawerWidth
                            : leftDrawerWidth < VIEWPORT_WIDTH
                                ? leftDrawerWidth
                                : 0
                        : 'auto',
                    right: target === 'bottom_right'
                        ? right < 0
                            ? collapsedRight + rightDrawerWidth
                            : rightDrawerWidth < VIEWPORT_WIDTH
                                ? rightDrawerWidth
                                : 0
                        : 'auto',
                }}
            >
                <mask id={`circle-mask-${target}`}>
                    <rect width={SVG_SIZE} height={SVG_SIZE} fill="black" />
                    <circle cx={target === 'bottom_left' ? SVG_SIZE : 0} cy="0" r={SVG_SIZE} fill="white" />
                    <circle cx={target === 'bottom_left' ? SVG_SIZE : 0} cy="0" r={SVG_SIZE - 1} fill="black" />
                </mask>
                <rect x="0" y="0" width={SVG_SIZE} height={SVG_SIZE} style={{
                    fill: 'var(--border)'
                }} mask={`url(#circle-mask-${target})`} />
            </svg>,
        [collapsedLeft, collapsedRight, left, leftDrawerWidth, right, rightDrawerWidth, svgStyle]
    )
}