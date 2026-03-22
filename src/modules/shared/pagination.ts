/**
 * Pagination Utility
 * Standardized pagination logic for all list endpoints
 * Reduces code duplication across admin services
 */

/**
 * Pagination Parameters from query string
 */
export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  offset?: string | number;
}

/**
 * Calculated Pagination Values
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Pagination Response structure for list endpoints
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculate pagination parameters from query
 * Ensures safe values and prevents SQL injection
 *
 * @param query Query object with page and limit
 * @param maxLimit Maximum allowed limit (default 100)
 * @returns Calculated pagination parameters
 *
 * @example
 * const pagination = calculatePagination({ page: 2, limit: 20 });
 * // Returns: { page: 2, limit: 20, offset: 20 }
 */
export function calculatePagination(
  query: PaginationQuery = {},
  maxLimit: number = 100
): PaginationParams {
  // Parse page number safely
  const page = Math.max(1, parseInt(String(query.page || 1), 10));

  // Parse limit safely and enforce max
  const limit = Math.max(
    1,
    Math.min(maxLimit, parseInt(String(query.limit || 10), 10))
  );

  // Calculate offset from page and limit
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build paginated response with metadata
 *
 * @param data Array of items
 * @param total Total count from database
 * @param pagination Pagination parameters
 * @returns Paginated response object with metadata
 *
 * @example
 * const response = buildPaginatedResponse(users, totalCount, pagination);
 * // Returns: { data: users, total, page, limit, totalPages, hasNextPage, hasPreviousPage }
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1,
  };
}

/**
 * Combined helper for common pagination workflow
 *
 * @param items Array of items from database
 * @param total Total count from database
 * @param query Query parameters from request
 * @param maxLimit Maximum allowed limit
 * @returns Complete paginated response
 *
 * @example
 * const response = createPaginatedResponse(users, totalCount, req.query);
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  query: PaginationQuery = {},
  maxLimit: number = 100
): PaginatedResponse<T> {
  const pagination = calculatePagination(query, maxLimit);
  return buildPaginatedResponse(items, total, pagination);
}
