/**
 * Product Response Transformer
 * Handles all data transformation from database to API response
 */

import { ProductRow } from './database.types';
import { AdminProduct } from './types';

/**
 * Transform database row to admin API response
 */
export function transformProductToAdmin(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    category: row.category || 'Uncategorized',
    status: row.status === 'ACTIVE' ? 'published' : 'draft',
    isFeatured: false,
    stock: 0,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/**
 * Transform multiple product rows to admin responses
 */
export function transformProductsToAdmin(rows: ProductRow[]): AdminProduct[] {
  return rows.map(transformProductToAdmin);
}



/**
 * Build WHERE clause from filter parameters
 */
export function buildWhereClause(filters: {
  status?: string;
  category?: string;
  search?: string;
}): { clause: string; params: any[] } {
  const conditions: string[] = ['p."deletedAt" IS NULL'];
  const params: any[] = [];

  if (filters.status && filters.status !== 'all') {
    conditions.push(`p.status = $${params.length + 1}`);
    params.push(filters.status === 'published' ? 'ACTIVE' : 'INACTIVE');
  }

  if (filters.category) {
    conditions.push(`p."categoryId" = $${params.length + 1}`);
    params.push(filters.category);
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    const searchCondition = `(
      p.name ILIKE $${params.length + 1} 
      OR p.slug ILIKE $${params.length + 2} 
      OR p.description ILIKE $${params.length + 3}
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
  sortBy: string = 'createdAt'
): { column: string; order: string } {
  const sortOrder = 'DESC';
  const column = sortBy === 'price' ? 'p."basePrice"' : 'p."createdAt"';
  return { column, order: sortOrder };
}
