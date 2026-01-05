import { useEffect, useState } from "react";

/**
 * Custom hook that returns a debounced value.
 * The returned value only updates after the specified delay has passed
 * without the input value changing.
 * 
 * @param value The value to debounce
 * @param delayMs The debounce delay in milliseconds (default: 1000ms)
 * @returns The debounced value
 */
export default function useDebounce<T>(value: T, delayMs: number = 1000): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handle = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => {
            window.clearTimeout(handle);
        };
    }, [value, delayMs]);

    return debouncedValue;
}
