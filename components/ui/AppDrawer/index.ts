import { ReactElement } from "react";
import styles from "./appDrawer.module.css";
import {
    useDrawerRefs,
    useStates,
    useChildren,
    useDrawerPositions,
    useAppDrawer,
    useDrawerSlot
} from "./hooks";

import { AppDrawerProvider, AppDrawerContext } from "./appDrawerProvider";

type DrawerPosition = 'left' | 'bottom' | 'right';
type DrawerChildElement = ReactElement<{ 'data-position'?: DrawerPosition }>;
type UseDrawerPositionsProps = {
    left?: {
        collapsedWidth: number;
        width: number;
    },
    bottom?: {
        collapsedHeight: number;
        height: number;
    },
    right?: {
        collapsedWidth: number;
        width: number;
    }
};
type AppDrawerProps = {
    collapsedSize?: { leftWidth?: number, bottomHeight?: number, rightWidth?: number },
    cornerRadius?: number,
    children: DrawerChildElement | DrawerChildElement[]
}
type DrawerPositions = Record<DrawerPosition, number>;
type OpenDrawerProps = DrawerPosition | 'initial';

export type {
    DrawerPosition,
    DrawerChildElement,
    UseDrawerPositionsProps,
    AppDrawerProps,
    DrawerPositions,
    OpenDrawerProps
}

export {
    styles,
    useDrawerRefs,
    useStates,
    useChildren,
    useDrawerPositions,
    useAppDrawer,
    useDrawerSlot,
    AppDrawerProvider,
    AppDrawerContext
};