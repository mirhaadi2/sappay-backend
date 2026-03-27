/**
 * Product Response Transformer
 * Handles all data transformation from database to API response
 * Enterprise-grade with performance optimization
 */

import { getR2SignedUrl } from '../../uploads/r2-utils';
import { ProductRow } from './database.types';
import { AdminProduct, AdminProductVariantDetail, AdminProductSellerOffering } from './types';

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
 * Transform seller offering to API response format
 */
const transformSellerOffering = (offering: any): AdminProductSellerOffering => ({
  sellerProductId: offering.sellerProductId,
  sellerId: offering.sellerId,
  sellerBusinessName: offering.sellerBusinessName,
  sellerOwnerName: offering.sellerOwnerName,
  sellerOwnerEmail: offering.sellerOwnerEmail,
  sellerBusinessPhone: offering.sellerBusinessPhone,
  sellerCommissionRate: offering.sellerCommissionRate ? Number(offering.sellerCommissionRate) : undefined,
  sellerStatus: offering.sellerStatus,
  sellerSku: offering.sellerSku,
  sellerPrice: Number(offering.sellerPrice),
  costPrice: offering.costPrice ? Number(offering.costPrice) : undefined,
  discountedPrice: offering.discountedPrice ? Number(offering.discountedPrice) : undefined,
  discountedPercent: offering.discountedPercent ? Number(offering.discountedPercent) : undefined,
  rating: offering.rating ? Number(offering.rating) : undefined,
  ratingCount: offering.ratingCount ? Number(offering.ratingCount) : undefined,
  sellerDescription: offering.sellerDescription,
  sellerImages: offering.sellerImages,
  sellerWeight: offering.sellerWeight ? Number(offering.sellerWeight) : undefined,
  sellerDimensions: offering.sellerDimensions,
  warrantyMonths: offering.warrantyMonths ? Number(offering.warrantyMonths) : undefined,
  sellerProductStatus: offering.sellerProductStatus,
  sellerProductCreatedAt: new Date(offering.sellerProductCreatedAt).toISOString(),
  sellerProductUpdatedAt: new Date(offering.sellerProductUpdatedAt).toISOString(),
  inventoryId: offering.inventoryId,
  totalStock: Number(offering.totalStock) || 0,
  availableStock: Number(offering.availableStock) || 0,
  reservedStock: Number(offering.reservedStock) || 0,
  soldStock: Number(offering.soldStock) || 0,
  reorderLevel: Number(offering.reorderLevel) || 0,
  lastRestockedAt: offering.lastRestockedAt ? new Date(offering.lastRestockedAt).toISOString() : undefined,
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

  // 3. Transform seller offerings
  const transformedSellerOfferings: AdminProductSellerOffering[] = Array.isArray(row.sellerOfferings)
    ? row.sellerOfferings.map(transformSellerOffering)
    : [];

  // 4. Map the data structure
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
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
    // Include seller offerings
    sellerOfferings: transformedSellerOfferings.length > 0 ? transformedSellerOfferings : undefined,
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
  const column = 'p."created_at"';
  return { column, order: sortOrder };
}
