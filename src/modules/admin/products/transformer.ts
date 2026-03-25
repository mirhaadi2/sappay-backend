/**
 * Product Response Transformer
 * Handles all data transformation from database to API response
 * Enterprise-grade with performance optimization
 */

import { getR2SignedUrl } from '../../uploads/r2-utils';
import { ProductRow } from './database.types';
import { AdminProduct, AdminProductVariantDetail } from './types';

/**
 * Resolves R2 URLs with better fallback and parallel execution support
 */
const resolveR2Url = async (key: string): Promise<string> => {
  if (!key) return '';
  if (key.startsWith('http')) return key;

  try {
    // Note: In production, consider if fetchFromR2 is necessary. 
    // Usually, generating a Signed URL doesn't require a network check.
    return await getR2SignedUrl(key);
  } catch (err) {
    console.error(`Failed to resolve R2 key: ${key}`, err);
    return '';
  }
};

/**
 * Transform variant to API response format
 */
const transformVariant = (variant: any): AdminProductVariantDetail => ({
  id: variant.id,
  sku: variant.sku,
  price: Number(variant.price),
  weight: variant.weight !== undefined ? Number(variant.weight) : undefined,
  status: variant.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
  createdAt: new Date(variant.createdAt).toISOString(),
  updatedAt: new Date(variant.updatedAt).toISOString(),
});

/**
 * Enhanced transformation that handles async image resolution
 * Includes variants count and detailed variant information
 */
export async function transformProductToAdmin(row: ProductRow): Promise<AdminProduct> {
  // 1. Start resolving images immediately
  const imagePromises = Array.isArray(row.images) 
    ? row.images.map(img => resolveR2Url(img)) 
    : [];

  const resolvedImages = await Promise.all(imagePromises);

  // 2. Transform variants to detailed format
  const transformedVariants: AdminProductVariantDetail[] = Array.isArray(row.variants) 
    ? row.variants.map(transformVariant)
    : [];

  // 3. Map the data structure
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    discountedPrice: row.discountedPrice !== undefined ? Number(row.discountedPrice) : undefined,
    discountedPercent: row.discountedPercent !== undefined ? Number(row.discountedPercent) : undefined,
    sku: row.sku,
    weight: row.weight !== undefined ? Number(row.weight) : undefined,
    gst_rate: row.gst_rate !== undefined ? Number(row.gst_rate) : undefined,
    category: row.category || 'Uncategorized',
    categoryName: row.categoryName || 'Uncategorized',
    status: row.status === 'ACTIVE' ? 'published' : 'draft',
    isFeatured: false,
    stock: Number(row.stock) || 0,
    // Safely resolve the first image as the primary imageUrl
    imageUrl: resolvedImages?.[0] || '/placeholder.png', 
    images: resolvedImages,
    // Include detailed variants and count
    variantsCount: row?.variantsCount || transformedVariants.length ||0,
    variants: transformedVariants.length > 0 ? transformedVariants : undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/**
 * Professional batch transformation
 * Processes all products and all their images in parallel
 */
export async function transformProductsToAdmin(rows: ProductRow[]): Promise<AdminProduct[]> {
  if (!rows || rows.length === 0) return [];
  
  // Use Promise.all to transform all products concurrently
  return await Promise.all(rows.map(row => transformProductToAdmin(row)));
}



/**
 * Build WHERE clause from filter parameters
 */
export function buildWhereClause(filters: {
  status?: string;
  category?: string;
  search?: string;
}): { clause: string; params: any[] } {
  const conditions: string[] = ['p."deleted_at" IS NULL'];
  const params: any[] = [];

  if (filters.status && filters.status !== 'all') {
    conditions.push(`p.status = :param${params.length}`);
    const normalized = String(filters.status).toLowerCase();
    if (normalized === 'published' || normalized === 'active') {
      params.push('ACTIVE');
    } else if (normalized === 'draft' || normalized === 'inactive') {
      params.push('INACTIVE');
    } else {
      params.push(filters.status);
    }
  }

  if (filters.category) {
    conditions.push(`p."category_id" = :param${params.length}`);
    params.push(filters.category);
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    const searchCondition = `(
      p.name ILIKE :param${params.length} 
      OR p.slug ILIKE :param${params.length + 1} 
      OR p.description ILIKE :param${params.length + 2}
    )`;
    conditions.push(searchCondition);
    params.push(searchTerm, searchTerm, searchTerm);
  }

  return {
    clause: conditions.join(' AND '),
    params,
  };
}

/**
 * Get sort column based on sortBy parameter
 */
export function resolveSortColumn(
  sortBy: string = 'created_at'
): { column: string; order: string } {
  const sortOrder = 'DESC';
  const column = sortBy === 'price' ? 'p."base_price"' : 'p."created_at"';
  return { column, order: sortOrder };
}
