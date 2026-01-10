/**
 * Photo format pricing configuration
 * Prices can be overridden per school
 */

export enum PhotoFormat {
  A4 = 'A4',
  A5 = 'A5',
  MAGNET = 'MAGNET',
  DIGITAL = 'DIGITAL',
}

// Default prices (fallback if school has no custom pricing)
export const DEFAULT_PRICING = {
  [PhotoFormat.A4]: 1500,
  [PhotoFormat. A5]: 1000,
  [PhotoFormat.MAGNET]: 2000,
  [PhotoFormat.DIGITAL]: 500,
} as const;

export const FORMAT_LABELS = {
  [PhotoFormat. A4]: 'Формат A4 (21×29.7 см)',
  [PhotoFormat.A5]: 'Формат A5 (14. 8×21 см)',
  [PhotoFormat.MAGNET]: 'Фото-магнит',
  [PhotoFormat.DIGITAL]: 'Цифровая копия',
} as const;

export const FORMAT_DESCRIPTIONS = {
  [PhotoFormat.A4]: 'Высококачественная печать на премиум фотобумаге',
  [PhotoFormat. A5]: 'Стандартный размер, идеально для рамок',
  [PhotoFormat. MAGNET]: 'Магнит на холодильник с вашим фото',
  [PhotoFormat. DIGITAL]: 'Цифровой файл в высоком разрешении',
} as const;

/**
 * School pricing type (from DB)
 */
export type SchoolPricing = {
  priceA4: number;
  priceA5: number;
  priceMagnet: number;
  priceDigital:  number;
};

/**
 * Get price for a format (with school-specific pricing)
 */
export function getPrice(
  format: PhotoFormat,
  schoolPricing?:  SchoolPricing | null
): number {
  if (!schoolPricing) {
    return DEFAULT_PRICING[format];
  }

  switch (format) {
    case PhotoFormat.A4:
      return schoolPricing.priceA4;
    case PhotoFormat. A5:
      return schoolPricing.priceA5;
    case PhotoFormat.MAGNET:
      return schoolPricing.priceMagnet;
    case PhotoFormat.DIGITAL:
      return schoolPricing.priceDigital;
    default:
      return DEFAULT_PRICING[format];
  }
}

/**
 * Format price in tenge to currency string
 */
export function formatPrice(tenge: number): string {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits:  0,
    maximumFractionDigits: 0,
  }).format(tenge);
}

/**
 * Calculate total price for items (with school pricing)
 */
export function calculateTotal(
  items: Array<{ format: PhotoFormat; quantity: number }>,
  schoolPricing?:  SchoolPricing | null
): number {
  return items. reduce((total, item) => {
    return total + getPrice(item.format, schoolPricing) * item.quantity;
  }, 0);
}