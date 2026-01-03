/**
 * Photo format pricing configuration
 * All prices are in tenge (KZT)
 */

export enum PhotoFormat {
  A4 = 'A4',
  A5 = 'A5',
  MAGNET = 'MAGNET',
  DIGITAL = 'DIGITAL',
}

export const PRICING = {
  [PhotoFormat.A4]: 1500, // 1500 ₸
  [PhotoFormat.A5]: 1000, // 1000 ₸
  [PhotoFormat. MAGNET]: 2000, // 2000 ₸
  [PhotoFormat.DIGITAL]:  500, // 500 ₸
} as const;

export const FORMAT_LABELS = {
  [PhotoFormat.A4]: 'Формат A4 (21×29.7 см)',
  [PhotoFormat.A5]: 'Формат A5 (14.8×21 см)',
  [PhotoFormat.MAGNET]: 'Фото-магнит',
  [PhotoFormat.DIGITAL]: 'Цифровая копия',
} as const;

export const FORMAT_DESCRIPTIONS = {
  [PhotoFormat.A4]: 'Высококачественная печать на премиум фотобумаге',
  [PhotoFormat.A5]: 'Стандартный размер, идеально для рамок',
  [PhotoFormat. MAGNET]: 'Магнит на холодильник с вашим фото',
  [PhotoFormat. DIGITAL]: 'Цифровой файл в высоком разрешении',
} as const;

/**
 * Get price for a format in tenge
 */
export function getPrice(format: PhotoFormat): number {
  return PRICING[format];
}

/**
 * Format price in tenge to currency string
 */
export function formatPrice(tenge: number): string {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits:  0,
    maximumFractionDigits:  0,
  }).format(tenge);
}

/**
 * Calculate total price for items
 */
export function calculateTotal(
  items: Array<{ format: PhotoFormat; quantity: number }>
): number {
  return items.reduce((total, item) => {
    return total + PRICING[item.format] * item.quantity;
  }, 0);
}