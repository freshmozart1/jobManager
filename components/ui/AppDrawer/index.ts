import styles from "./appDrawer.module.css";
import useAppDrawer from "./hooks/useAppDrawer";

import { AppDrawer, APP_DRAWER_CONTEXT } from "./appDrawer";
import type {
    Dispatch,
    ReactElement,
    SetStateAction
} from "react";

/**
 * Represents the action to update the state of a drawer's content.
 * It accepts either the new content (ReactElement or null) or a state updater function.
 */
type SetDrawerStateAction = SetStateAction<DrawerChildElement | null>;

/**
 * A dispatch function for updating the state of a drawer.
 */
type DispatchDrawer = Dispatch<SetDrawerStateAction>;

/**
 * Defines the possible positions for the drawer: left, right, or bottom.
 */
type DrawerPosition = "left" | "right" | "bottom";

/**
 * Represents a child element of the drawer, which may have a 'data-position' prop.
 */
type DrawerChildElement = ReactElement<{ 'data-position'?: DrawerPosition }>;

/**
 * Arguments for opening a drawer. Can be a specific position or 'initial' to reset.
 */
type OpenDrawerProps = DrawerPosition | 'initial';

/**
 * Context provided by the AppDrawer to control drawer state.
 */
type AppDrawerContext = {
    /** Sets the content of the left drawer. */
    setLeftDrawer: DispatchDrawer;
    /** Sets the content of the right drawer. */
    setRightDrawer: DispatchDrawer;
    /** Sets the content of the bottom drawer. */
    setBottomDrawer: DispatchDrawer;
    /** Opens a specific drawer, optionally setting its content and its collapsed size (width or height). */
    openDrawer: (target: OpenDrawerProps, content?: DrawerChildElement | null, size?: number) => void;
};

export {
    styles,
    useAppDrawer,
    AppDrawer,
    APP_DRAWER_CONTEXT
};

export type {
    AppDrawerContext,
    SetDrawerStateAction,
    OpenDrawerProps,
    DrawerPosition,
    DrawerChildElement
}