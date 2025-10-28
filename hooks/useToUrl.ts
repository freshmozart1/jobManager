import { useCallback } from 'react';
import { toUrl } from '@/lib/utils';

/**
 * useToUrl
 * Returns a stable function that converts a relative API path to an absolute URL.
 *  - Leaves existing absolute http/https URLs untouched.
 *  - On the client, prefixes window.location.origin for relative paths.
 *  - On the server (should not typically run for client components), falls back to NEXT_PUBLIC_BASE_URL or localhost.
 */
export default function useToUrl() {
    return useCallback((path: string) => toUrl(path), []);
}