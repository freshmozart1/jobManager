"use client";
import { ReactNode, useEffect } from "react";
import { DrawerPosition } from "../appDrawerProvider";
import { useAppDrawer } from ".";


export default function useDrawerSlot(pos: DrawerPosition, node: ReactNode | null) {
    const { setSlot } = useAppDrawer();
    useEffect(() => {
        setSlot(pos, node);
        return () => setSlot(pos, null);
    }, [pos, node, setSlot]);
}
