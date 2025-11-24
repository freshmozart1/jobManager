"use client";

import { useEffect, useRef, useState } from "react";

import { PersonalInformationSkill } from "@/types";

import { BANNER_TIMEOUT_MS } from "../shared";

export type UndoState = {
    names: string[];
    mergedCount: number;
    snapshot: PersonalInformationSkill[];
};

export function useUndoBanner() {
    const [undoState, setUndoState] = useState<UndoState | null>(null);
    const undoTimerRef = useRef<number | null>(null);
    const undoRemainingRef = useRef<number>(BANNER_TIMEOUT_MS);
    const undoStartRef = useRef<number>(0);

    useEffect(() => {
        if (!undoState) {
            undoRemainingRef.current = BANNER_TIMEOUT_MS;
            if (undoTimerRef.current) {
                window.clearTimeout(undoTimerRef.current);
                undoTimerRef.current = null;
            }
            return;
        }
        undoStartRef.current = Date.now();
        if (undoTimerRef.current) {
            window.clearTimeout(undoTimerRef.current);
        }
        undoTimerRef.current = window.setTimeout(() => {
            setUndoState(null);
            undoTimerRef.current = null;
        }, undoRemainingRef.current);
    }, [undoState]);

    const pauseUndoTimer = () => {
        if (!undoState || undoTimerRef.current === null) return;
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
        const elapsed = Date.now() - undoStartRef.current;
        undoRemainingRef.current = Math.max(0, undoRemainingRef.current - elapsed);
    };

    const resumeUndoTimer = () => {
        if (!undoState) return;
        if (undoRemainingRef.current <= 0) {
            setUndoState(null);
            return;
        }
        undoStartRef.current = Date.now();
        undoTimerRef.current = window.setTimeout(() => {
            setUndoState(null);
            undoTimerRef.current = null;
        }, undoRemainingRef.current);
    };

    const clearUndo = () => {
        setUndoState(null);
        undoRemainingRef.current = BANNER_TIMEOUT_MS;
        if (undoTimerRef.current) {
            window.clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }
    };

    return {
        undoState,
        setUndoState,
        pauseUndoTimer,
        resumeUndoTimer,
        clearUndo,
        undoRemainingRef,
    } as const;
}
