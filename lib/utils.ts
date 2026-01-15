import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskUsername(name: string): string {
  if (!name) return "***";
  const len = name.length;
  if (len <= 2) return name.charAt(0) + "*";
  if (len <= 4) return name.charAt(0) + "*".repeat(len - 2) + name.charAt(len - 1);
  return name.slice(0, 2) + "*".repeat(len - 3) + name.slice(-1);
}
