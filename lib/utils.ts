import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIDR(value: number | string): string {
  const number = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(number)) return '0'
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(number)
}

export function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(/,/g, '.')) || 0
}
