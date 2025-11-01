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

export function normaliseTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const normalised: string[] = [];
  for (const value of input) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalised.push(trimmed);
  }
  return normalised;
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

export function formatMonthYear(date: Date | null | undefined): string {
  if (!date) return '';
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year}-${month.toString().padStart(2, '0')}`;
}

export function makeUtcMonthYear(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
}

export function parseMonthYear(value: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [yearStr, monthStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  const date = makeUtcMonthYear(year, month - 1);
  return Number.isNaN(date.getTime()) ? null : date;
}