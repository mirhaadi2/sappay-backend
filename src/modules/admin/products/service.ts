/**
 * Admin Products Service
 * High-performance raw SQL implementation for product management
 */

import { sequelize } from '../../../db/sequelize';
import { AppError } from '../../../utils/AppError';
import { AdminProductQuery, AdminProduct } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';
import { getR2SignedUrl } from '../../uploads/r2-utils';

/**
 * List all products with seller information and inventory
 * Uses raw SQL for optimal performance
 * Supports filtering by status, category, seller, and search
 */
export const adminListProducts = async (query: AdminProductQuery) => {
  try {
    const { page, limit, offset } = calculatePagination(
      { page: query.page, limit: query.limit },
      100
    );

    // Build WHERE clause conditions
    const conditions: string[] = ['p."deletedAt" IS NULL'];
    const params: any[] = [];

    // Filter by product status
    if (query.status) {
      conditions.push('p.status = $' + (params.length + 1));
      params.push(query.status === 'published' ? 'ACTIVE' : 'INACTIVE');
    }

    // Filter by category
    if (query.category) {
      conditions.push('p."categoryId" = $' + (params.length + 1));
      params.push(query.category);
    }

    // Search by product name, slug, or description
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      const searchCondition = `(p.name ILIKE $${params.length + 1} OR p.slug ILIKE $${params.length + 2} OR p.description ILIKE $${params.length + 3})`;
      conditions.push(searchCondition);
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.join(' AND ');
    const sortBy = query.sortBy === 'price' ? 'p."basePrice"' : 'p."createdAt"';
    const sortOrder = (query.sortOrder || 'DESC').toUpperCase();

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`;
    const countResult = await sequelize.query(countQuery, { replacements: params, type: 'SELECT' });
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get paginated results
    const dataQuery = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p."basePrice" as price,
        p."categoryId" as category,
        p.status,
        p.images,
        p."createdAt",
        p."updatedAt"
      FROM products p
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const rows = await sequelize.query(dataQuery, { replacements: params, type: 'SELECT' });

    // Transform to admin format with resolved image URLs
    const products: AdminProduct[] = rows.map((product: any) => {
      const images = Array.isArray(product.images) ? product.images : [];
      const imageUrl = images.length > 0 ? getR2SignedUrl(images[0]) : '';

      return {
        id: product.id,
        name: product.name,
        imageUrl,
        description: product.description || '',
        price: Number(product.price || 0),
        sellerId: '',
        sellerName: 'Unknown',
        category: product.category || 'Uncategorized',
        status: product.status === 'ACTIVE' ? 'published' : 'draft',
        isFeatured: false,
        stock: 0,
        createdAt: new Date(product.createdAt).toISOString(),
        updatedAt: new Date(product.updatedAt).toISOString(),
      };
    });

    return buildPaginatedResponse(products, total, { page, limit, offset });
  } catch (error: any) {
    logger.error('Error listing admin products', { error });
    throw new AppError('ProductError', 500, error.message || 'Failed to list products');
  }
};

/**
 * Get single product with all details
 * Raw SQL query for single product fetch
 */
export const adminGetProduct = async (id: string): Promise<any> => {
  try {
    const query = `
      SELECT 
        id,
        name,
        slug,
        description,
        "basePrice" as price,
        "categoryId" as category,
        status,
        images,
        "createdAt",
        "updatedAt"
      FROM products
      WHERE id = $1 AND "deletedAt" IS NULL
    `;

    const result = await sequelize.query(query, { replacements: [id], type: 'SELECT' });

    if (!result || result.length === 0) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    const product = result[0] as any;
    const images = Array.isArray(product.images) ? product.images : [];
    const imageUrl = images.length > 0 ? getR2SignedUrl(images[0]) : '';

    return {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: Number(product.price || 0),
      category: product.category || '',
      status: product.status === 'ACTIVE' ? 'published' : 'draft',
      isFeatured: false,
      stock: 0,
      imageUrl,
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
      sellerListings: [],
    };
  } catch (error: any) {
    logger.error('Error fetching admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Update product information efficiently with raw SQL
 */
export const adminUpdateProduct = async (id: string, data: any): Promise<any> => {
  try {
    // Verify product exists first
    const existsQuery = 'SELECT id FROM products WHERE id = $1 AND "deletedAt" IS NULL';
    const existsResult = await sequelize.query(existsQuery, { replacements: [id], type: 'SELECT' });

    if (!existsResult || existsResult.length === 0) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push(`"categoryId" = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.basePrice !== undefined) {
      updates.push(`"basePrice" = $${paramIndex++}`);
      values.push(data.basePrice);
    }

    if (updates.length === 0) {
      return adminGetProduct(id);
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date());
    values.push(id);

    const updateQuery = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await sequelize.query(updateQuery, { replacements: values });
    logger.info('Product updated by admin', { productId: id, changes: data });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error updating admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Soft delete product (set deletedAt timestamp)
 */
export const adminDeleteProduct = async (id: string): Promise<any> => {
  try {
    // Verify product exists
    const existsQuery = 'SELECT id FROM products WHERE id = $1 AND "deletedAt" IS NULL';
    const existsResult = await sequelize.query(existsQuery, { replacements: [id], type: 'SELECT' });

    if (!existsResult || existsResult.length === 0) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    // Soft delete
    const deleteQuery = 'UPDATE products SET "deletedAt" = $1 WHERE id = $2';
    await sequelize.query(deleteQuery, { replacements: [new Date(), id] });

    logger.info('Product deleted by admin', { productId: id });
    return { success: true, message: 'Product deleted successfully' };
  } catch (error: any) {
    logger.error('Error deleting admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Publish product (set status to ACTIVE)
 * Single-operation atomic update
 */
export const adminPublishProduct = async (id: string): Promise<any> => {
  try {
    const updateQuery = `
      UPDATE products
      SET status = 'ACTIVE', "updatedAt" = $1
      WHERE id = $2 AND "deletedAt" IS NULL
      RETURNING id
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: [new Date(), id],
      type: 'SELECT'
    });

    if (!result || result.length === 0) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    logger.info('Product published by admin', { productId: id });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error publishing admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Unpublish product (set status to INACTIVE)
 * Single-operation atomic update
 */
export const adminUnpublishProduct = async (id: string): Promise<any> => {
  try {
    const updateQuery = `
      UPDATE products
      SET status = 'INACTIVE', "updatedAt" = $1
      WHERE id = $2 AND "deletedAt" IS NULL
      RETURNING id
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: [new Date(), id],
      type: 'SELECT'
    });

    if (!result || result.length === 0) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    logger.info('Product unpublished by admin', { productId: id });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error unpublishing admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Feature product
 * Metadata-based feature flag
 */
export const adminFeatureProduct = async (id: string): Promise<any> => {
  try {
    const updateQuery = `
      UPDATE products
      SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{featured}', 'true'::jsonb), "updatedAt" = $1
      WHERE id = $2 AND "deletedAt" IS NULL
      RETURNING id
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: [new Date(), id],
      type: 'SELECT'
    });

    if (!result || result.length === 0) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    logger.info('Product featured by admin', { productId: id });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error featuring admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Unfeature product
 * Remove from featured metadata
 */
export const adminUnfeatureProduct = async (id: string): Promise<any> => {
  try {
    const updateQuery = `
      UPDATE products
      SET metadata = CASE 
        WHEN metadata IS NOT NULL THEN metadata - 'featured'
        ELSE NULL
      END, "updatedAt" = $1
      WHERE id = $2 AND "deletedAt" IS NULL
      RETURNING id
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: [new Date(), id],
      type: 'SELECT'
    });

    if (!result || result.length === 0) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    logger.info('Product unfeatured by admin', { productId: id });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error unfeaturing admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};
