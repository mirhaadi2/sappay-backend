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
} from './repository';
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
    return await transformProductToAdmin(product!);
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
    await updateFields(id, updates);
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
