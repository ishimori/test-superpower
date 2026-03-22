import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP").format(value);
}

export function formatDate(value: string | null): string {
  if (!value) return "";
  return value; // YYYY-MM-DD そのまま表示（必要に応じて変換）
}
