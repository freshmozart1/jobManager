'use client';

import { JSX, useCallback, type CSSProperties } from "react";
import { VIEWPORT_WIDTH } from "@/components/ui/AppDrawer/appDrawer";

export default function useSVGCorner(
    left: number,
    right: number,
    collapsedLeft: number,
    collapsedRight: number,
    leftDrawerWidth: number,
    rightDrawerWidth: number,
    cornerRadius: number,
    svgStyle?: CSSProperties
): (target: "bottom_left" | "bottom_right") => JSX.Element {
    return useCallback(
        (target: 'bottom_left' | 'bottom_right') =>
            <svg
                width={cornerRadius}
                height={cornerRadius}
                viewBox={`0 0 ${cornerRadius} ${cornerRadius}`}
                style={{
                    ...svgStyle,
                    left: target === 'bottom_left'
                        ? left < 0
                            ? left === -Number.MAX_VALUE ? -cornerRadius : collapsedLeft + leftDrawerWidth
                            : leftDrawerWidth < VIEWPORT_WIDTH
                                ? leftDrawerWidth
                                : 0
                        : 'auto',
                    right: target === 'bottom_right'
                        ? right < 0
                            ? right === -Number.MAX_VALUE ? -cornerRadius : collapsedRight + rightDrawerWidth
                            : rightDrawerWidth < VIEWPORT_WIDTH
                                ? rightDrawerWidth
                                : 0
                        : 'auto',
                }}
            >
                <mask id={`circle-mask-${target}`}>
                    <rect width={cornerRadius} height={cornerRadius} fill="black" />
                    <circle cx={target === 'bottom_left' ? cornerRadius : 0} cy="0" r={cornerRadius} fill="white" />
                    <circle cx={target === 'bottom_left' ? cornerRadius : 0} cy="0" r={cornerRadius - 1} fill="black" />
                </mask>
                <rect x="0" y="0" width={cornerRadius} height={cornerRadius} style={{
                    fill: 'var(--border)'
                }} mask={`url(#circle-mask-${target})`} />
            </svg>,
        [collapsedLeft, collapsedRight, left, leftDrawerWidth, right, rightDrawerWidth, svgStyle, cornerRadius]
    )
}