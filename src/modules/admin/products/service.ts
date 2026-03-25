/**
 * Admin Products Service
 * Enterprise-grade business logic layer with clean architecture
 *
 * Architecture:
 * - Repository Pattern: Data access isolated in repository.ts
 * - Guard Functions: Validation and checks in guards.ts
 * - Transformers: Data transformation in transformer.ts
 * - Service: Pure business logic, minimal if statements
 */

import {
  getProductCount,
  findProducts,
  findById,
  updateFields,
  softDelete,
  updateStatus,
  updateMetadata,
  removeMetadata,
  getProductVariants,
  deleteProductVariantsByProduct,
  createProductVariants,
  upsertProductVariants,
} from './repository';
import {
  createProductService,
  generateProductVariantsWithSku,
} from '../../website/products/service';
import { findProductBySku, findProductVariantBySku } from '../../website/products/repository';

const calculateDiscountedPercent = (
  price: number | undefined,
  discountedPrice: number | undefined
): number | undefined => {
  if (price === undefined || discountedPrice === undefined) return undefined;
  if (Number.isNaN(price) || Number.isNaN(discountedPrice) || price <= 0) return undefined;
  return Number((((price - discountedPrice) / price) * 100).toFixed(2));
};
import {
  requireProductExists,
  validateUpdateData,
  validatePaginationParams,
  validateFilterParams,
  handleServiceError,
} from './guards';
import {
  transformProductToAdmin,
  transformProductsToAdmin,
  buildWhereClause,
  resolveSortColumn,
} from './transformer';
import { AdminProductQuery, AdminProduct } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';

/**
 * List all products with advanced filtering and pagination
 */
export const adminListProducts = async (
  query: AdminProductQuery
): Promise<ReturnType<typeof buildPaginatedResponse>> => {
  try {
    const { page, limit, offset } = validatePaginationParams(
      query.page,
      query.limit,
      100
    );

    const filters = validateFilterParams(query);
    const { clause: whereClause, params: whereParams } = buildWhereClause(filters);
    const { column: sortColumn, order: sortOrder } = resolveSortColumn(query.sortBy);

    const [total, rows] = await Promise.all([
      getProductCount(whereClause, whereParams),
      findProducts(
        whereClause,
        whereParams,
        sortColumn,
        sortOrder,
        limit,
        offset
      ),
    ]);

    const products = await transformProductsToAdmin(rows);
    return buildPaginatedResponse(products, total, { page, limit, offset });
  } catch (error) {
    handleServiceError(error, 'List products');
  }
};

/**
 * Get single product details
 */
export const adminGetProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, 'Product');
    const product = await findById(id);
    if (!product) {
      throw new Error('Product not found after exists check');
    }

    const variants = await getProductVariants(id);
    const rowWithVariants = {
      ...product,
      variants: variants || [],
    };

    return await transformProductToAdmin(rowWithVariants as any);
  } catch (error) {
    handleServiceError(error, 'Fetch product');
  }
};

/**
 * Update product information
 */
export const adminUpdateProduct = async (
  id: string,
  data: any
): Promise<any> => {
  try {
    await requireProductExists(id, 'Product');
    const updates = validateUpdateData(data);

    // Ensure SKU is unique if being updated
    if (updates.sku) {
      const normalizedSku = updates.sku.trim().toUpperCase();
      const existingBySku = await findProductBySku(normalizedSku);
      if (existingBySku && existingBySku.id !== id) {
        throw new Error('SKU already exists');
      }
      const existingVariant = await findProductVariantBySku(normalizedSku);
      if (existingVariant) {
        throw new Error('SKU conflicts with existing variant');
      }
      updates.sku = normalizedSku;
    }

    // Ensure discountedPercent is auto-calculated if discountedPrice or price updates are provided
    const existingProduct = await findById(id);
    if (!existingProduct) {
      throw new Error('Product not found after exists check');
    }

    const currentPrice = typeof existingProduct.price === 'number' ? existingProduct.price : Number(existingProduct.price);
    const currentDiscountedPrice =
      existingProduct.discountedPrice === undefined || existingProduct.discountedPrice === null
        ? undefined
        : Number(existingProduct.discountedPrice);

    const newPrice = updates.price !== undefined ? Number(updates.price) : currentPrice;
    const newDiscountedPrice =
      updates.discountedPrice !== undefined ? Number(updates.discountedPrice) : currentDiscountedPrice;

    const newDiscountPercent = calculateDiscountedPercent(newPrice, newDiscountedPrice);

    if (newDiscountPercent !== undefined) {
      updates.discountedPercent = newDiscountPercent;
    } else if (updates.discountedPrice !== undefined && updates.discountedPrice === null) {
      // removed discounted price should reset discount percent
      updates.discountedPercent = null;
    }

    const variantUpdateData = updates.variants;
    delete updates.variants;

    await updateFields(id, updates);

    // Handle variant updates intelligently - only update/create what's provided
    if (Array.isArray(variantUpdateData) && variantUpdateData.length > 0) {
      await upsertProductVariants(id, variantUpdateData);
    }

    logger.info('Product updated', { productId: id, updates });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, 'Update product');
  }
};

/**
 * Delete product (soft delete)
 */
export const adminDeleteProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, 'Product');
    await softDelete(id);
    logger.info('Product deleted', { productId: id });
    return { success: true, message: 'Product deleted successfully' };
  } catch (error) {
    handleServiceError(error, 'Delete product');
  }
};

/**
 * Publish product
 */
export const adminPublishProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, 'Product');
    await updateStatus(id, 'ACTIVE');
    logger.info('Product published', { productId: id });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, 'Publish product');
  }
};

/**
 * Unpublish product
 */
export const adminUnpublishProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, 'Product');
    await updateStatus(id, 'INACTIVE');
    logger.info('Product unpublished', { productId: id });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, 'Unpublish product');
  }
};

/**
 * Mark product as featured
 */
export const adminFeatureProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, 'Product');
    await updateMetadata(id, 'featured', true);
    logger.info('Product featured', { productId: id });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, 'Feature product');
  }
};

/**
 * Remove product from featured
 */
export const adminCreateProduct = async (input: any): Promise<any> => {
  try {
    const {
      name,
      slug,
      description,
      price,
      discountedPrice,
      sku,
      weight,
      gst_rate,
      status,
      categoryId,
      images,
      sellerId,
    } = input;

    if (!name || !(categoryId || input.category)) {
      throw new Error('Name and categoryId are required');
    }

    const finalSlug = (slug || name)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    let discountPercent: number | undefined;
    const normalizedPrice = Number(price);
    const normalizedDiscountedPrice =
      discountedPrice !== undefined ? Number(discountedPrice) : undefined;

    if (normalizedDiscountedPrice !== undefined && !isNaN(normalizedPrice) && normalizedPrice > 0) {
      discountPercent = Number(
        (((normalizedPrice - normalizedDiscountedPrice) / normalizedPrice) * 100).toFixed(2)
      );
    }

    const productPayload = {
      name,
      description,
      slug: finalSlug,
      categoryId: categoryId || input.category,
      basePrice: normalizedPrice,
      discountedPrice: normalizedDiscountedPrice,
      discountedPercent: discountPercent,
      sku,
      weight: weight !== undefined ? Number(weight) : undefined,
      gst_rate: Number(gst_rate ?? 18),
      status: status && (status === 'ACTIVE' || status === 'INACTIVE') ? status : 'ACTIVE',
      images: images || [],
      variants: Array.isArray(input.variants) ? input.variants : [],
    };

    const created = await createProductService(productPayload);

    // Optionally link seller product if sellerId is provided
    if (sellerId) {
      // Admin can attach product to seller in future; no-op here unless needed.
    }

    return created;
  } catch (error) {
    handleServiceError(error, 'Create product');
  }
};

export const adminUnfeatureProduct = async (id: string): Promise<any> => {
  try {
    await requireProductExists(id, 'Product');
    await removeMetadata(id, 'featured');
    logger.info('Product unfeatured', { productId: id });
    return await adminGetProduct(id);
  } catch (error) {
    handleServiceError(error, 'Unfeature product');
  }
};
