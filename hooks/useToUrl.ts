import { useCallback } from 'react';

/**
 * useToUrl
 * Returns a stable function that converts a relative API path to an absolute URL.
 *  - Leaves existing absolute http/https URLs untouched.
 *  - On the client, prefixes window.location.origin for relative paths.
 *  - On the server (should not typically run for client components), falls back to NEXT_PUBLIC_BASE_URL or localhost.
 */
export default function useToUrl() {
    return useCallback((path: string) => {
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
        const host = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return `${host}${path}`;
    }, []);
}