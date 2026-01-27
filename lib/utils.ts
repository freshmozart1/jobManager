import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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