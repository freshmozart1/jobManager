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
                xmlns="http://www.w3.org/2000/svg"
                width={cornerRadius}
                height={cornerRadius}
                viewBox={`0 0 ${cornerRadius} ${cornerRadius}`}
                shapeRendering='geometricPrecision'
                clipPath={target === 'bottom_left'
                    ? `path('M 0 0 L 0 ${cornerRadius} L ${cornerRadius} ${cornerRadius} L ${cornerRadius} ${cornerRadius - 1} A ${cornerRadius - 1} ${cornerRadius - 1} 0 0 1 1 0 Z')`
                    : `path('M ${cornerRadius} 0 L ${cornerRadius} ${cornerRadius} L 0 ${cornerRadius} L 0 ${cornerRadius - 1} A ${cornerRadius - 1} ${cornerRadius - 1} 0 0 0 ${cornerRadius - 1} 0 Z')`}

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
                    backdropFilter: 'blur(3px)',
                    backgroundColor: 'oklch(from var(--background) l c h / 0.35)',
                }}
            >
                <path
                    d={target === 'bottom_left'
                        ? `M 0 0 A ${cornerRadius} ${cornerRadius} 0 0 0 ${cornerRadius} ${cornerRadius} L ${cornerRadius} ${cornerRadius - 1} A ${cornerRadius - 1} ${cornerRadius - 1} 0 0 1 1 0 Z`
                        : `M ${cornerRadius} 0 A ${cornerRadius} ${cornerRadius} 0 0 1 0 ${cornerRadius} L 0 ${cornerRadius - 1} A ${cornerRadius - 1} ${cornerRadius - 1} 0 0 0 ${cornerRadius - 1} 0 Z`
                    }
                    fill="var(--border)"
                />
            </svg>,
        [collapsedLeft, collapsedRight, left, leftDrawerWidth, right, rightDrawerWidth, svgStyle, cornerRadius]
    )
}