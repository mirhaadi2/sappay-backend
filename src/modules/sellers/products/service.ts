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
  const { sellerPrice, costPrice, discountedPrice, discountedPercent, rating, ratingCount, status } = sellerData;

  if (!sellerPrice) {
    throw new AppError('BadRequest', 400, 'Seller price is required');
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

  // Validate price logic
  if (costPrice && costPrice > sellerPrice) {
    throw new AppError('BadRequest', 400, 'Selling price cannot be less than cost price');
  }

  // Create SellerProduct
  const sellerProduct = await createSellerProduct({
    sellerId,
    productId,
    sellerPrice,
    costPrice,
    discountedPrice,
    discountedPercent,
    rating,
    ratingCount,
    status,
  });

  // Initialize inventory for this seller product
  const inventory = await initializeInventoryService(sellerProduct.id, 0);

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

  const { sellerPrice, costPrice } = updates;
  if (sellerPrice && costPrice && costPrice > sellerPrice) {
    throw new AppError('BadRequest', 400, 'Selling price cannot be less than cost price');
  }

  return await updateSellerProduct(sellerProductId, updates);
};

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

  return await updateSellerProduct(sellerProductId, { status });
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