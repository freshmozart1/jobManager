"use client";

import {
    createContext,
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
    Children,
    useReducer
} from "react";
import { styles } from ".";
import type {
    CSSProperties,
    MouseEvent,
    RefObject,
    ActionDispatch,
    JSX,
    Dispatch,
    SetStateAction,
    ReactNode,
} from "react";
import type {
    AppDrawerContext,
    SetDrawerStateAction,
    OpenDrawerProps,
    DrawerPosition,
    DrawerChildElement
} from ".";

type DrawerPositionsMap = Record<DrawerPosition, number>;
type DrawerSizeMap = DrawerPositionsMap;
type DrawerRef = HTMLDivElement | null;
type DrawerRefMap = Record<DrawerPosition, RefObject<DrawerRef>>;
type DrawerMap = Record<DrawerPosition, DrawerChildElement | null>;
type DispatchDrawerSize = Dispatch<SetStateAction<DrawerSizeMap>>;
type DispatchOpenDrawer = ActionDispatch<[target: OpenDrawerProps]>;

/**
 * Props for the AppDrawer component.
 */
type AppDrawerProps = {
    /**
     * Custom collapsed sizes for each drawer position.
     * Defaults to 48px for left/right and 25px for bottom.
     */
    collapsedSize?: DrawerSizeMap,
    /**
     * Corner radius for the drawer overlay and panels.
     * Defaults to 48px.
     */
    cornerRadius?: number,
    /**
     * The main content of the application, and optionally drawer contents.
     */
    children: ReactNode;
};

const DEFAULT_VISIBLE_WIDTH = 48,
    DEFAULT_CORNER_RADIUS = 48,
    DEFAULT_VISIBLE_HEIGHT = 25,
    TRANSITION = 'bottom 0.3s ease-in-out, left 0.3s ease-in-out, right 0.3s ease-in-out, background-color 0.3s ease-in-out, height 0.3s ease-in-out';

/**
 * Context for accessing AppDrawer functionality.
 */
export const APP_DRAWER_CONTEXT = createContext<AppDrawerContext | null>(null);

/**
 * AppDrawer Component
 * 
 * A layout component that provides collapsible drawers on the left, right, and bottom sides.
 * It manages the state and transitions of these drawers and provides a context for controlling them.
 * 
 * @param props - The {@link AppDrawerProps} for the component.
 * @returns The AppDrawer component with context provider and layout.
 */
export function AppDrawer(
    {
        collapsedSize: collapsedSizeProp,
        cornerRadius = DEFAULT_CORNER_RADIUS,
        children
    }: AppDrawerProps
): JSX.Element {
    const [transition, setTransition]: [string, Dispatch<SetStateAction<string>>] = useState<string>('none');
    const pendingOpen = useRef<OpenDrawerProps | null>(null);

    // Filter children to find those meant for drawers based on 'data-position' prop
    const childrenArray: DrawerChildElement[] = useMemo<DrawerChildElement[]>(
        () => Children.toArray(children) as DrawerChildElement[],
        [children]
    );

    /**
     * Helper to find the initial content for a specific drawer position from children.
     */
    const init: (target: DrawerPosition) => DrawerChildElement | null = useCallback<(target: DrawerPosition) => DrawerChildElement | null>(
        (target: DrawerPosition) => childrenArray.find((child) => child.props['data-position'] === target) || null,
        [childrenArray]
    );
    const [drawers, setDrawers]: [DrawerMap, Dispatch<SetStateAction<DrawerMap>>] = useState<DrawerMap>({
        left: init('left'),
        right: init('right'),
        bottom: init('bottom')
    });

    const leftRef: RefObject<DrawerRef> = useRef<DrawerRef>(null);
    const rightRef: RefObject<DrawerRef> = useRef<DrawerRef>(null);
    const bottomRef: RefObject<DrawerRef> = useRef<DrawerRef>(null);

    /**
     * Calculate the collapsed sizes, falling back to defaults if not provided.
     */
    const [collapsedSizes, setCollapsedSizes]: [DrawerSizeMap, DispatchDrawerSize] = useState<DrawerSizeMap>(
        () => ({
            left: collapsedSizeProp?.left ?? DEFAULT_VISIBLE_WIDTH,
            right: collapsedSizeProp?.right ?? DEFAULT_VISIBLE_WIDTH,
            bottom: collapsedSizeProp?.bottom ?? DEFAULT_VISIBLE_HEIGHT
        })
    );
    useEffect(() => {
        setCollapsedSizes({
            left: collapsedSizeProp?.left ?? DEFAULT_VISIBLE_WIDTH,
            right: collapsedSizeProp?.right ?? DEFAULT_VISIBLE_WIDTH,
            bottom: collapsedSizeProp?.bottom ?? DEFAULT_VISIBLE_HEIGHT
        });
    }, [collapsedSizeProp]);

    // State to hold the actual measured sizes of the drawer elements
    const [sizes, setSizes]: [DrawerSizeMap, DispatchDrawerSize] = useState<DrawerSizeMap>({
        left: 0,
        right: 0,
        bottom: 0
    });

    // Measure drawer sizes when content changes
    useEffect(
        () => setSizes({
            left: leftRef.current?.getBoundingClientRect().width ?? 0,
            right: rightRef.current?.getBoundingClientRect().width ?? 0,
            bottom: bottomRef.current?.getBoundingClientRect().height ?? 0
        }),
        [drawers]
    );

    /**
     * Calculate initial positions (closed state) based on collapsed sizes and actual sizes.
     * A negative value hides the drawer content, leaving only the collapsed strip visible.
     */
    const initialPositions: DrawerPositionsMap = useMemo<DrawerPositionsMap>(
        () => ([
            'left',
            'bottom',
            'right'
        ] as DrawerPosition[]).reduce<DrawerPositionsMap>(
            (
                acc: DrawerPositionsMap,
                pos: DrawerPosition
            ) => {
                acc[pos] = drawers[pos]
                    ? collapsedSizes[pos] - sizes[pos]
                    : -Number.MAX_VALUE;
                return acc;
            },
            {} as DrawerPositionsMap
        ),
        [
            drawers,
            sizes,
            collapsedSizes
        ]
    );

    /**
     * Reducer to handle opening/closing drawers.
     * Toggles the position between 0 (open) and initialPosition (closed).
     */
    const [positions, openDrawer]: [DrawerPositionsMap, DispatchOpenDrawer] = useReducer<DrawerPositionsMap, [target: OpenDrawerProps]>(
        (
            cur: DrawerPositionsMap,
            target: OpenDrawerProps
        ): DrawerPositionsMap => target === 'initial'
                ? { ...initialPositions }
                : {
                    ...initialPositions,
                    [target]: cur[target] === 0
                        ? initialPositions[target]
                        : 0
                },
        initialPositions
    );

    // Reset positions when initial configuration changes
    useEffect(
        () => {
            openDrawer('initial');
            if (pendingOpen.current) {
                const target: OpenDrawerProps = pendingOpen.current;
                pendingOpen.current = null;
                setTimeout(() => openDrawer(target), 50);
            }
        },
        [initialPositions]
    );

    const px: (v: number) => string = useCallback<(v: number) => string>(
        (v: number) => `${v}px`,
        []
    );
    const pxIf: (exists: boolean, v: number) => string = useCallback<(exists: boolean, v: number) => string>(
        (
            exists: boolean,
            v: number
        ) => px(
            exists
                ? v
                : 0
        ),
        [px]
    );

    /**
     * Handle clicks on drawer tabs or overlay to toggle drawer state.
     */
    const handleClick: (
        e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
        target: OpenDrawerProps
    ) => void = useCallback<(
        e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
        target: OpenDrawerProps
    ) => void>(
        (
            e: MouseEvent<HTMLDivElement>,
            target: OpenDrawerProps
        ) => {
            e.preventDefault();
            setTransition(TRANSITION);
            openDrawer(target);
        },
        []
    );

    /**
     * Check if a specific drawer is currently open.
     */
    const isOpen: (pos: DrawerPosition) => boolean = useCallback<(pos: DrawerPosition) => boolean>(
        (pos: DrawerPosition) => positions[pos] === 0 && sizes[pos] > collapsedSizes[pos],
        [positions, sizes, collapsedSizes]
    );
    const anyOpen: boolean = isOpen('left') || isOpen('right') || isOpen('bottom');

    /**
     * The overlay element that dims the background when a drawer is open.
     * It also handles closing drawers when clicked.
     */
    const overlay: JSX.Element = useMemo<JSX.Element>(
        () => {
            const calc: (
                p: DrawerPosition,
                b?: boolean
            ) => string = (
                p: DrawerPosition,
                b: boolean = false
            ) => pxIf(
                !!(
                    b
                        ? drawers.bottom && drawers[p]
                        : drawers[p]
                ),
                b
                    ? cornerRadius
                    : isOpen(p)
                        ? sizes[p]
                        : collapsedSizes[p]
            );
            return <div
                className={styles.overlay + ' print:display-none'}
                onClick={e => handleClick(e, 'initial')}
                style={{
                    '--left': calc('left'),
                    '--right': calc('right'),
                    '--bottom': calc('bottom'),
                    '--transition': transition,
                    '--pEvents': anyOpen
                        ? 'auto'
                        : 'none',
                    '--bgColor': anyOpen
                        ? 'rgba(0, 0, 0, 0.35)'
                        : 'transparent',
                    '--borderLeftRadius': calc('left', true),
                    '--borderRightRadius': calc('right', true),
                } as CSSProperties}
            />;
        },
        [
            transition,
            anyOpen,
            cornerRadius,
            collapsedSizes,
            drawers,
            sizes,
            handleClick,
            isOpen,
            pxIf
        ]
    );

    const refs = useMemo<DrawerRefMap>(
        () => ({
            left: leftRef,
            right: rightRef,
            bottom: bottomRef
        }),
        [
            leftRef,
            rightRef,
            bottomRef
        ]
    );

    type RenderDrawer = (target: DrawerPosition) => JSX.Element;

    /**
     * Renders a specific drawer (left, right, or bottom).
     */
    const renderDrawer: RenderDrawer = useCallback<RenderDrawer>(
        (target: DrawerPosition) => {
            const getOffset: (side: DrawerPosition) => string = (side: DrawerPosition) => pxIf(
                !!drawers[side],
                side === 'bottom'
                    ? (
                        positions[side] < 0
                            ? collapsedSizes[side]
                            : sizes[side]
                    ) + cornerRadius
                    : positions[side] + (
                        target === 'bottom'
                            ? sizes[side]
                            : 0
                    )
            );
            return <div
                ref={refs[target]}
                className={styles[`${target}Drawer`] + ' print:display-none'}
                style={{
                    '--left': getOffset('left'),
                    '--bottom': px(positions.bottom),
                    '--right': getOffset('right'),
                    '--transition': transition,
                    '--borderOffset': getOffset('bottom'),
                    '--minWidth': px(target === 'bottom' ? 0 : collapsedSizes[target]),
                    '--paddingTop': px(collapsedSizes.bottom),
                } as CSSProperties}
                onClick={e => handleClick(e, target)}
            >
                {target === 'bottom' && <div className={styles.collapseBar} />}
                {drawers[target]}
            </div>
        },
        [
            cornerRadius,
            collapsedSizes,
            refs,
            drawers,
            positions,
            sizes,
            transition,
            handleClick,
            px,
            pxIf
        ]
    );

    const setDrawer = useCallback(
        (
            v: SetDrawerStateAction,
            t: DrawerPosition
        ) => setDrawers((d: DrawerMap) => ({
            ...d,
            [t]: typeof v === 'function'
                ? v(d[t])
                : v
        })),
        []
    );

    /**
     * Context value exposed to consumers.
     */
    const context = useMemo<AppDrawerContext>(
        () => ({
            setLeftDrawer: (v: SetDrawerStateAction) => setDrawer(v, 'left'),
            setRightDrawer: (v: SetDrawerStateAction) => setDrawer(v, 'right'),
            setBottomDrawer: (v: SetDrawerStateAction) => setDrawer(v, 'bottom'),
            openDrawer: (t: OpenDrawerProps, c?: DrawerChildElement | null, size?: number) => {
                setTransition(TRANSITION);
                let configChanged: boolean = false;
                if (size !== undefined && t !== 'initial') {
                    setCollapsedSizes((prev: DrawerSizeMap) => ({
                        ...prev,
                        [t]: size
                    }));
                    configChanged = true;
                }
                if (c !== undefined && t !== 'initial') {
                    setDrawer(c, t);
                    configChanged = true;
                }
                if (configChanged) pendingOpen.current = t;
                else openDrawer(t);
            }
        }),
        [setDrawer]
    );

    const mainChildren: DrawerChildElement[] = useMemo<DrawerChildElement[]>(
        () => childrenArray.filter(c => !c.props['data-position']),
        [childrenArray]
    );

    return (
        <div id="appDrawerHost">
            {/* Inject dynamic styles for padding based on drawer presence and size */}
            <style>{`
                :has(> #appDrawerHost) {
                    padding-left: ${pxIf(!!drawers.left, collapsedSizes.left)};
                    padding-right: ${pxIf(!!drawers.right, collapsedSizes.right)};
                    padding-bottom: ${pxIf(!!drawers.bottom, collapsedSizes.bottom)};
                }
            `}</style>
            <APP_DRAWER_CONTEXT.Provider value={context}>
                {overlay}
                {drawers.left && renderDrawer('left')}
                {drawers.right && renderDrawer('right')}
                {drawers.bottom && renderDrawer('bottom')}
                {mainChildren}
            </APP_DRAWER_CONTEXT.Provider>
        </div>
    );
}