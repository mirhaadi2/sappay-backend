import { AppError } from './AppError';

/**
 * Generate a consistent SKU scheme for products and variants.
 * Format: [3UPPER]-[WEIGHT]G-[5CHAR]
 */
export const generateSku = (name: string, weight?: number | string): string => {
  if (!name || name.trim().length < 2) {
    throw new AppError('BadRequest', 400, 'SKU generation requires product name');
  }
  const cleanedName = name.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const prefix = cleanedName.slice(0, 3);
  const weightPart = weight ? `-${String(weight).replace(/[^0-9]/g, '')}G` : '';
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();

  return `${prefix}${weightPart}-${randomPart}`;
};

/**
 * Normalize SKU input to our canonical form
 */
export const normalizeSku = (sku: string): string => {
  if (!sku) return '';
  return sku.trim().replace(/\s+/g, '-').toUpperCase();
};