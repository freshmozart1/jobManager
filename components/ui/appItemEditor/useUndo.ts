"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseUndoOptions = {
    timeoutMs?: number;
};

export function useUndo<TState>(options: UseUndoOptions = {}) {
    const timeoutMs = options.timeoutMs ?? 5000;

    const [state, setState] = useState<TState | null>(null);

    const timerRef = useRef<number | null>(null);
    const remainingRef = useRef<number>(timeoutMs);
    const startRef = useRef<number>(0);

    useEffect(() => {
        if (!state) {
            remainingRef.current = timeoutMs;
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        startRef.current = Date.now();

        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
            setState(null);
            timerRef.current = null;
        }, remainingRef.current);
    }, [state, timeoutMs]);

    const pause = useCallback(() => {
        if (!state || timerRef.current === null) return;
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        const elapsed = Date.now() - startRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }, [state]);

    const resume = useCallback(() => {
        if (!state) return;
        if (remainingRef.current <= 0) {
            setState(null);
            return;
        }
        startRef.current = Date.now();
        timerRef.current = window.setTimeout(() => {
            setState(null);
            timerRef.current = null;
        }, remainingRef.current);
    }, [state]);

    const clear = useCallback(() => {
        setState(null);
        remainingRef.current = timeoutMs;
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, [timeoutMs]);

    return {
        state,
        setState,
        pause,
        resume,
        clear,
        remainingRef,
    } as const;
}
