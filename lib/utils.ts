import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }


export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error("Chunk size must be greater than 0");
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * toUrl
 * Converts a relative API path to an absolute URL.
 *  - Leaves existing absolute http/https URLs untouched.
 *  - On the client, prefixes window.location.origin for relative paths.
 *  - On the server, falls back to NEXT_PUBLIC_BASE_URL or localhost.
 */
export function toUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  const host = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${host}${path}`;
}