import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency consistently for both server and client rendering
 * to avoid hydration mismatches
 */
export function formatCurrency(amount: number, currency = 'ZAR'): string {
  // Use a consistent format that works the same on server and client
  // This avoids locale-based differences that cause hydration errors
  return amount.toFixed(2);
}

/**
 * Format currency with ZAR symbol
 */
export function formatPrice(amount: number): string {
  return `R${formatCurrency(amount)}`;
}
