/**
 * Product Service Guard Functions
 * Replaces verbose if statements with clean, reusable guards
 */

import { exists } from './repository';
import { AppError } from '../../../utils/AppError';
import logger from '../../../utils/logger';

/**
 * Ensures product exists or throws NotFoundError
 * @throws AppError with 404 status
 */
export async function requireProductExists(
  productId: string,
  context: string = 'Product'
): Promise<void> {
  const productExists = await exists(productId);
  if (!productExists) {
    throw new AppError('NotFoundError', 404, `${context} not found`);
  }
}

/**
 * Validates update data structure
 * Returns cleaned update object or throws validation error
 */
export function validateUpdateData(
  data: any,
  allowedFields: string[] = ['name', 'description', 'category', 'price', 'discountedPrice', 'sku', 'weight', 'gst_rate', 'status', 'variants']
): Record<string, any> {
  const updates: Record<string, any> = {};

  allowedFields.forEach(field => {
    if (data?.[field] !== undefined) {
      updates[field] = data[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new AppError('ValidationError', 400, 'No valid fields to update');
  }

  return updates;
}

/**
 * Validates product status transition
 */
export function validateStatusTransition(
  currentStatus: 'ACTIVE' | 'INACTIVE',
  newStatus: 'ACTIVE' | 'INACTIVE'
): boolean {
  if (currentStatus === newStatus) {
    throw new AppError(
      'ValidationError',
      400,
      `Product is already ${currentStatus}`
    );
  }
  return true;
}

/**
 * Validates search/filter parameters
 */
export function validateFilterParams(params: any): {
  status?: string;
  category?: string;
  search?: string;
} {
  const result: any = {};

  if (params.status) {
    const normalizedStatus = String(params.status).toLowerCase();
    if (['active', 'inactive', 'published', 'draft', 'all'].includes(normalizedStatus)) {
      if (normalizedStatus === 'published') {
        result.status = 'ACTIVE';
      } else if (normalizedStatus === 'draft') {
        result.status = 'INACTIVE';
      } else if (normalizedStatus === 'all') {
        result.status = 'all';
      } else {
        result.status = normalizedStatus.toUpperCase();
      }
    }
  }

  if (params.category && typeof params.category === 'string') {
    result.category = params.category;
  }

  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    result.search = params.search.trim();
  }

  return result;
}

/**
 * Validates pagination parameters
 */
export function validatePaginationParams(
  page: any,
  limit: any,
  maxLimit: number = 100
): { page: number; limit: number; offset: number } {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  return { page: pageNum, limit: limitNum, offset };
}

/**
 * Handles errors with appropriate logging and user-friendly messages
 */
export function handleServiceError(
  error: any,
  context: string = 'Operation'
): never {
  if (error instanceof AppError) {
    throw error;
  }

  logger.error(`${context} failed`, {
    error: error?.message,
    stack: error?.stack,
  });

  throw new AppError(
    'InternalError',
    500,
    `${context} failed. Please try again later.`
  );
}
