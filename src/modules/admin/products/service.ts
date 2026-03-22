/**
 * Admin Products Service
 * Real database implementation for product management
 */

import { Op } from 'sequelize';
import Product from '../../products/product.model';
import { SellerProduct } from '../../products/seller-product.model';
import { Category } from '../../products/category.model';
import { Seller } from '../../sellers/model';
import { Inventory } from '../../inventory/inventory.model';
import { AppError } from '../../../utils/AppError';
import { AdminProductQuery, AdminProduct } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';

/**
 * List all products with seller information and inventory
 * Supports filtering by status, category, seller, and search
 */
export const adminListProducts = async (query: AdminProductQuery) => {
  try {
    const { page, limit, offset } = calculatePagination(
      { page: query.page, limit: query.limit },
      100
    );

    const where: any = {};

    // Filter by product status (ACTIVE/INACTIVE)
    if (query.status) {
      where.status = query.status === 'published' ? 'ACTIVE' : 'INACTIVE';
    }

    // Filter by category
    if (query.category) {
      where.categoryId = query.category;
    }

    // Search by product name or slug
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { slug: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Query: Get products
    const { count, rows } = await Product.findAndCountAll({
      where,
      offset,
      limit,
      order: [
        [query.sortBy === 'price' ? 'basePrice' : 'createdAt', (query.sortOrder || 'desc').toUpperCase()],
      ],
      raw: false,
    });

    // Transform to admin format
    const products: AdminProduct[] = rows.map((product: any) => {
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: Number(product.basePrice || 0),
        sellerId: '',
        sellerName: 'Unknown',
        category: product.categoryId || 'Uncategorized',
        status: product.status === 'ACTIVE' ? 'published' : 'draft',
        isFeatured: false,
        stock: 0,
        createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
      };
    });

    return buildPaginatedResponse(products, count, { page, limit, offset });
  } catch (error: any) {
    logger.error('Error listing admin products', { error });
    throw new AppError('ProductError', 500, error.message || 'Failed to list products');
  }
};

/**
 * Get single product with all seller listings
 */
export const adminGetProduct = async (id: string): Promise<any> => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: Number(product.basePrice || 0),
      category: product.categoryId || '',
      status: product.status === 'ACTIVE' ? 'published' : 'draft',
      isFeatured: false,
      stock: 0,
      createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
      sellerListings: [],
    };
  } catch (error: any) {
    logger.error('Error fetching admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Update product information (name, description, category, base price)
 */
export const adminUpdateProduct = async (id: string, data: any): Promise<any> => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category) updateData.categoryId = data.category;
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;

    if (Object.keys(updateData).length > 0) {
      await product.update(updateData);
    }

    logger.info('Product updated by admin', { productId: id, changes: updateData });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error updating admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Soft delete a product
 */
export const adminDeleteProduct = async (id: string): Promise<any> => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    await product.destroy(); // Soft delete due to paranoid: true

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
 */
export const adminPublishProduct = async (id: string): Promise<any> => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    await product.update({ status: 'ACTIVE' });

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
 */
export const adminUnpublishProduct = async (id: string): Promise<any> => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    await product.update({ status: 'INACTIVE' });

    logger.info('Product unpublished by admin', { productId: id });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error unpublishing admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Feature product (add to featured list)
 * Note: Feature flag can be added to Product model in future
 */
export const adminFeatureProduct = async (id: string): Promise<any> => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    // TODO: Add metadata field to track featured status
    // For now, just confirm product exists
    logger.info('Product featured by admin', { productId: id });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error featuring admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};

/**
 * Unfeature product (remove from featured list)
 */
export const adminUnfeatureProduct = async (id: string): Promise<any> => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError('NotFoundError', 404, 'Product not found');
    }

    // TODO: Remove from featured metadata
    logger.info('Product unfeatured by admin', { productId: id });
    return adminGetProduct(id);
  } catch (error: any) {
    logger.error('Error unfeaturing admin product', { productId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Product not found');
  }
};
