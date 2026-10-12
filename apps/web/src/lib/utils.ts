import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value);
}
