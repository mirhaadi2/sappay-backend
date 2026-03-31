/**
 * Seller Products Service
 * Business logic for seller product operations
 */

import {
  findBySellerAndProduct,
  createSellerProduct,
  getSellerProducts,
  findSellerProductById,
  updateSellerProduct,
  findProductById,
  findAllProductsCatalog,
  invalidateProductsCache,
} from '../../website/products/repository';
import { initializeInventoryService } from '../inventory/service';
import { AppError } from '../../../utils/AppError';
import { SellerProductCreateInput, SellerProductUpdateInput, SellerProductsListParams, SellerProductsListResponse } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import { transformSellerProductsList } from './transformer';

/**
 * Add a product to seller's catalog
 */
export const addProductToSellerService = async (
  sellerId: string,
  productId: string,
  sellerData: SellerProductCreateInput
) => {
  const { sellerPrice, stock, description, images, status } = sellerData;

  if (!sellerPrice) {
    throw new AppError('BadRequest', 400, 'Seller price is required');
  }

  if (stock === undefined || stock < 0) {
    throw new AppError('BadRequest', 400, 'Stock must be a valid positive number');
  }

  // Validate product exists
  const product = await findProductById(productId);
  if (!product) {
    throw new AppError('NotFound', 404, 'Product not found');
  }

  // Check if seller already has this product
  const existing = await findBySellerAndProduct(sellerId, productId);
  if (existing) {
    throw new AppError('BadRequest', 400, 'You already have this product listed');
  }

  // Create SellerProduct
  const sellerProduct = await createSellerProduct({
    sellerId,
    productId,
    sellerPrice,
    description,
    images,
    status,
  });

  // Invalidate product cache so catalog-based pages reflect this seller addition
  await invalidateProductsCache();

  // Initialize inventory for this seller product with the provided stock
  const inventory = await initializeInventoryService(sellerProduct.id, stock);

  return {
    sellerProduct,
    inventory,
  };
};

/**
 * Get seller's products list
 */
export const getSellerProductsService = async (
  sellerId: string,
  params: SellerProductsListParams
): Promise<SellerProductsListResponse> => {
  const { page = 1, limit = 20, status } = params;

  const { page: validatedPage, limit: validatedLimit, offset } = calculatePagination(
    { page, limit },
    100
  );

  const filters: any = {
    limit: validatedLimit,
    offset,
  };

  if (status && status !== 'all') {
    filters.status = status;
  }

  // Note: search and category filtering would need to be implemented in repository
  // For now, we'll use the existing getSellerProducts function
  const result = await getSellerProducts(sellerId, filters);

  const transformedProducts = transformSellerProductsList(result.products);

  return buildPaginatedResponse(transformedProducts, result.total, {
    page: validatedPage,
    limit: validatedLimit,
    offset,
  });
};

/**
 * Update seller product pricing
 */
export const updateSellerProductPriceService = async (
  sellerId: string,
  sellerProductId: string,
  updates: SellerProductUpdateInput
) => {
  const sp = await findSellerProductById(sellerProductId);
  if (!sp) {
    throw new AppError('NotFound', 404, 'Product not found');
  }

  if (sp.sellerId !== sellerId) {
    throw new AppError('Forbidden', 403, 'Unauthorized');
  }

  await invalidateProductsCache();

  return await updateSellerProduct(sellerProductId, updates);
}

/**
 * Update seller product status
 */
export const updateSellerProductStatusService = async (
  sellerId: string,
  sellerProductId: string,
  status: 'ACTIVE' | 'INACTIVE'
) => {
  const sp = await findSellerProductById(sellerProductId);
  if (!sp) {
    throw new AppError('NotFound', 404, 'Product not found');
  }

  if (sp.sellerId !== sellerId) {
    throw new AppError('Forbidden', 403, 'Unauthorized');
  }

  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new AppError('BadRequest', 400, 'Invalid status value');
  }

  await invalidateProductsCache();

  return await updateSellerProduct(sellerProductId, { status });
};

/**
 * Get catalog products (lightweight) for seller UI
 */
export const getCatalogProductsService = async (query: any) => {
  const products = await findAllProductsCatalog(query || {});
  return products;
};

/**
 * Get seller product details
 */
export const getSellerProductDetailsService = async (
  sellerId: string,
  sellerProductId: string
) => {
  const sp = await findSellerProductById(sellerProductId);
  if (!sp) {
    throw new AppError('NotFound', 404, 'Product not found');
  }

  if (sp.sellerId !== sellerId) {
    throw new AppError('Forbidden', 403, 'Unauthorized');
  }

  return sp;
};