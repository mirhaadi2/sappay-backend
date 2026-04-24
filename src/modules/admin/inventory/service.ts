/**
 * Admin Inventory Service
 * Enterprise-grade business logic layer for inventory management
 *
 * Architecture:
 * - Repository Pattern: Data access isolated in repository functions
 * - Transaction Management: Proper Sequelize transactions for data integrity
 * - Error Handling: Comprehensive error handling with rollback
 * - Logging: Detailed logging for audit trails
 */

import { sequelize } from '../../../db/sequelize';
import { QueryTypes, Transaction } from 'sequelize';
import { Inventory } from '../../sellers/inventory/model';
import { AppError } from '../../../utils/AppError';
import logger from '../../../utils/logger';
import {
    AdminInventoryItem,
    AdminInventoryUpdateInput,
    AdminAddStockInput,
    AdminRemoveStockInput,
    AdminInventoryQuery,
    AdminInventoryHistoryItem,
} from './types';

/**
 * Get inventory list with advanced filtering and pagination
 */
export const adminListInventory = async (params: AdminInventoryQuery) => {
    try {
        const {
            page = 1,
            limit = 20,
            productId,
            sellerId,
            lowStock = false,
            search,
        } = params;

        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [];
        let replacements: any = { limit, offset };

        if (productId) {
            whereConditions.push('p.id = :productId');
            replacements.productId = productId;
        }

        // if (sellerId) {
        //   whereConditions.push('s.id = :sellerId');
        //   replacements.sellerId = sellerId;
        // }

        if (lowStock) {
            whereConditions.push('i.available_stock <= i.reorder_level');
        }

        if (search) {
            whereConditions.push('(p.name ILIKE :search OR s.business_name ILIKE :search OR sp.seller_sku ILIKE :search)');
            replacements.search = `%${search}%`;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const sqlQuery = `
      SELECT
        i.id,
        i.seller_product_id as "sellerProductId",
        i.product_id as "productId",
        i.total_stock as "totalStock",
        i.available_stock as "availableStock",
        i.reserved_stock as "reservedStock",
        i.sold_stock as "soldStock",
        i.reorder_level as "reorderLevel",
        i.last_restocked_at as "lastRestockedAt",
        i.created_at as "createdAt",
        i.updated_at as "updatedAt",
        p.sku,
        p.id as "productId",
        -- sp.id as "sellerProductId",
        -- sp.seller_sku as "sellerSku",
        -- sp.seller_price as "sellerPrice",
        -- sp.discounted_price as "discountedPrice",
        -- sp.discounted_percent as "discountedPercent",
        -- s.business_name as "sellerName",
        -- s.id as "sellerId",
        p.name as "productName",
        p.id as "productId"
      FROM inventory i
      -- INNER JOIN seller_products sp ON i.seller_product_id = sp.id
      INNER JOIN products p ON i.product_id = p.id
      -- INNER JOIN sellers s ON sp.seller_id = s.id
      ${whereClause}
      ORDER BY i.updated_at DESC
      LIMIT :limit OFFSET :offset
    `;

        const countQuery = `
      SELECT COUNT(*)::int as count
      FROM inventory i
      -- INNER JOIN seller_products sp ON i.seller_product_id = sp.id
      INNER JOIN products p ON i.product_id = p.id
      -- INNER JOIN sellers s ON sp.seller_id = s.id
      ${whereClause}
    `;

        const [rows, countResult] = await Promise.all([
            sequelize.query(sqlQuery, {
                replacements,
                type: QueryTypes.SELECT,
            }),
            sequelize.query(countQuery, {
                replacements,
                type: QueryTypes.SELECT,
            })
        ]);

        const total = (countResult[0] as any)?.count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
            data: rows as AdminInventoryItem[],
            pagination: {
                page,
                limit,
                total,
                totalPages,
            }
        };
    } catch (error) {
        logger.error('Error listing inventory', { error, params });
        throw new AppError('InternalServerError', 500, 'Failed to fetch inventory');
    }
};

/**
 * Get inventory for a specific product across all sellers
 */
export const adminGetProductInventory = async (productId: string) => {
    try {
        const sqlQuery = `
      SELECT
        i.id,
        i.seller_product_id as "sellerProductId",
        i.product_id as "productId",
        i.total_stock as "totalStock",
        i.available_stock as "availableStock",
        i.reserved_stock as "reservedStock",
        i.sold_stock as "soldStock",
        i.reorder_level as "reorderLevel",
        i.last_restocked_at as "lastRestockedAt",
        i.created_at as "createdAt",
        i.updated_at as "updatedAt",
        p.sku,
        p.id as "productId",
        -- sp.id as "sellerProductId",
        -- sp.seller_sku as "sellerSku",
        -- sp.seller_price as "sellerPrice",
        -- sp.discounted_price as "discountedPrice",
        -- sp.discounted_percent as "discountedPercent",
        -- s.business_name as "sellerName",
        -- s.id as "sellerId",
        p.name as "productName",
        p.id as "productId"
      FROM inventory i
      -- INNER JOIN seller_products sp ON i.seller_product_id = sp.id
      INNER JOIN products p ON i.product_id = p.id
      -- INNER JOIN sellers s ON sp.seller_id = s.id
      WHERE p.id = :productId
      ORDER BY i.created_at DESC
    `;

        const result = await sequelize.query(sqlQuery, {
            replacements: { productId },
            type: QueryTypes.SELECT,
        });

        return result as AdminInventoryItem[];
    } catch (error) {
        logger.error('Error getting product inventory', { error, productId });
        throw new AppError('InternalServerError', 500, 'Failed to fetch product inventory');
    }
};

/**
 * Update inventory for a specific inventory item
 */
export const adminUpdateInventory = async (inventoryId: string, updates: AdminInventoryUpdateInput) => {
    const transaction = await sequelize.transaction();

    try {
        const inventory = await Inventory.findByPk(inventoryId, { transaction });
        if (!inventory) {
            throw new AppError('NotFound', 404, 'Inventory not found');
        }

        const { totalStock, availableStock, reorderLevel } = updates;

        // Calculate available stock if total stock is being updated
        let finalAvailableStock = availableStock;
        if (totalStock !== undefined && availableStock === undefined) {
            // If only total stock is provided, adjust available stock accordingly
            const currentTotal = inventory.totalStock;
            const currentAvailable = inventory.availableStock;
            const difference = totalStock - currentTotal;
            finalAvailableStock = currentAvailable + difference;
        }

        const updateData: any = {};
        if (totalStock !== undefined) updateData.totalStock = totalStock;
        if (finalAvailableStock !== undefined) updateData.availableStock = Math.max(0, finalAvailableStock);
        if (reorderLevel !== undefined) updateData.reorderLevel = reorderLevel;

        // Update last restocked timestamp if stock is being increased
        if (totalStock && totalStock > inventory.totalStock) {
            updateData.lastRestockedAt = new Date();
        }

        await inventory.update(updateData, { transaction });

        // Create inventory history record
        if (updates.notes || Object.keys(updateData).length > 0) {
            const { InventoryHistory } = await import('../../sellers/inventory/histories/model');

            await InventoryHistory.create({
                inventoryId,
                sellerProductId: inventory.sellerProductId,
                type: 'ADJUSTMENT',
                quantity: totalStock ? totalStock - inventory.totalStock : 0,
                previousStock: inventory.totalStock,
                newStock: totalStock || inventory.totalStock,
                notes: updates.notes || 'Admin inventory adjustment',
            }, { transaction });
        }

        await transaction.commit();

        logger.info('Inventory updated by admin', {
            inventoryId,
            updates: updateData,
            notes: updates.notes
        });

        return await Inventory.findByPk(inventoryId);
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating inventory', { error, inventoryId, updates });
        throw error instanceof AppError ? error : new AppError('InternalServerError', 500, 'Failed to update inventory');
    }
};

/**
 * Add stock to inventory
 */
export const adminAddStock = async (inventoryId: string, input: AdminAddStockInput) => {
    const transaction = await sequelize.transaction();

    try {
        const inventory = await Inventory.findByPk(inventoryId, { transaction });
        if (!inventory) {
            throw new AppError('NotFound', 404, 'Inventory not found');
        }

        const { quantity, notes } = input;

        if (quantity <= 0) {
            throw new AppError('BadRequest', 400, 'Quantity must be positive');
        }

        const newTotalStock = inventory.totalStock + quantity;
        const newAvailableStock = inventory.availableStock + quantity;

        await inventory.update({
            totalStock: newTotalStock,
            availableStock: newAvailableStock,
            lastRestockedAt: new Date(),
        }, { transaction });

        // Create inventory history record
        const { InventoryHistory } = await import('../../sellers/inventory/histories/model');

        await InventoryHistory.create({
            inventoryId,
            sellerProductId: inventory.sellerProductId,
            type: 'STOCK_ADDED',
            quantity,
            previousStock: inventory.totalStock,
            newStock: newTotalStock,
            notes: notes || `Admin added ${quantity} units`,
        }, { transaction });

        await transaction.commit();

        logger.info('Stock added by admin', { inventoryId, quantity, notes });

        return await Inventory.findByPk(inventoryId);
    } catch (error) {
        await transaction.rollback();
        logger.error('Error adding stock', { error, inventoryId, input });
        throw error instanceof AppError ? error : new AppError('InternalServerError', 500, 'Failed to add stock');
    }
};

/**
 * Remove stock from inventory
 */
export const adminRemoveStock = async (inventoryId: string, input: AdminRemoveStockInput) => {
    const transaction = await sequelize.transaction();

    try {
        const inventory = await Inventory.findByPk(inventoryId, { transaction });
        if (!inventory) {
            throw new AppError('NotFound', 404, 'Inventory not found');
        }

        const { quantity, reason, notes } = input;

        if (quantity <= 0) {
            throw new AppError('BadRequest', 400, 'Quantity must be positive');
        }

        if (inventory.availableStock < quantity) {
            throw new AppError('BadRequest', 400, 'Insufficient available stock');
        }

        const newTotalStock = Math.max(0, inventory.totalStock - quantity);
        const newAvailableStock = Math.max(0, inventory.availableStock - quantity);

        await inventory.update({
            totalStock: newTotalStock,
            availableStock: newAvailableStock,
        }, { transaction });

        // Create inventory history record
        const { InventoryHistory } = await import('../../sellers/inventory/histories/model');

        await InventoryHistory.create({
            inventoryId,
            sellerProductId: inventory.sellerProductId,
            type: 'STOCK_REMOVED',
            quantity: -quantity,
            previousStock: inventory.totalStock,
            newStock: newTotalStock,
            reference: reason,
            notes: notes || `Admin removed ${quantity} units: ${reason}`,
        }, { transaction });

        await transaction.commit();

        logger.info('Stock removed by admin', { inventoryId, quantity, reason, notes });

        return await Inventory.findByPk(inventoryId);
    } catch (error) {
        await transaction.rollback();
        logger.error('Error removing stock', { error, inventoryId, input });
        throw error instanceof AppError ? error : new AppError('InternalServerError', 500, 'Failed to remove stock');
    }
};

/**
 * Get inventory history with pagination
 */
export const adminGetInventoryHistory = async (page: number = 1, limit: number = 20, filters: {
    productId?: string;
    sellerId?: string;
    inventoryId?: string;
} = {}) => {
    try {
        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [];
        let replacements: any = { limit, offset };

        if (filters.productId) {
            whereConditions.push('p.id = :productId');
            replacements.productId = filters.productId;
        }

        if (filters.sellerId) {
            whereConditions.push('s.id = :sellerId');
            replacements.sellerId = filters.sellerId;
        }

        if (filters.inventoryId) {
            whereConditions.push('i.id = :inventoryId');
            replacements.inventoryId = filters.inventoryId;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const sqlQuery = `
      SELECT
        ih.id,
        ih.type,
        ih.quantity,
        ih.previous_stock as "previousStock",
        ih.new_stock as "newStock",
        ih.reference,
        ih.notes,
        ih.created_at as "createdAt",
        i.id as "inventoryId",
        p.sku,
        p.id as "productId",
        -- sp.seller_sku as "sellerSku",
        -- s.business_name as "sellerName",
        p.name as "productName"
      FROM inventory_history ih
      INNER JOIN inventory i ON ih.inventory_id = i.id
      -- INNER JOIN seller_products sp ON ih.seller_product_id = sp.id
      INNER JOIN products p ON i.product_id = p.id
      -- INNER JOIN sellers s ON sp.seller_id = s.id
      ${whereClause}
      ORDER BY ih.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

        const countQuery = `
      SELECT COUNT(*)::int as count
      FROM inventory_history ih
      INNER JOIN inventory i ON ih.inventory_id = i.id
      -- INNER JOIN seller_products sp ON ih.seller_product_id = sp.id
      INNER JOIN products p ON i.product_id = p.id
      -- INNER JOIN sellers s ON sp.seller_id = s.id
      ${whereClause}
    `;

        const [rows, countResult] = await Promise.all([
            sequelize.query(sqlQuery, {
                replacements,
                type: QueryTypes.SELECT,
            }),
            sequelize.query(countQuery, {
                replacements,
                type: QueryTypes.SELECT,
            })
        ]);

        const total = (countResult[0] as any)?.count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
            data: rows as AdminInventoryHistoryItem[],
            pagination: {
                page,
                limit,
                total,
                totalPages,
            }
        };
    } catch (error) {
        logger.error('Error getting inventory history', { error, page, limit, filters });
        throw new AppError('InternalServerError', 500, 'Failed to fetch inventory history');
    }
};

/**
 * Get inventory statistics
 */
export const adminGetInventoryStats = async () => {
    try {
        const statsQuery = `
      SELECT
        COUNT(*)::int as "totalItems",
        SUM(total_stock)::int as "totalStock",
        SUM(available_stock)::int as "availableStock",
        SUM(reserved_stock)::int as "reservedStock",
        SUM(sold_stock)::int as "soldStock",
        COUNT(CASE WHEN available_stock <= reorder_level THEN 1 END)::int as "lowStockItems",
        COUNT(DISTINCT product_id)::int as "uniqueProducts"
        -- COUNT(DISTINCT seller_id)::int as "uniqueSellers"
      FROM (
        SELECT
          i.total_stock,
          i.available_stock,
          i.reserved_stock,
          i.sold_stock,
          i.reorder_level,
          i.product_id
          -- i.seller_id
        FROM inventory i
      ) as inventory_stats
    `;

        const result = await sequelize.query(statsQuery, {
            type: QueryTypes.SELECT,
            plain: true,
        });

        return result as {
            totalItems: number;
            totalStock: number;
            availableStock: number;
            reservedStock: number;
            soldStock: number;
            lowStockItems: number;
            uniqueProducts: number;
            uniqueSellers: number;
        };
    } catch (error) {
        logger.error('Error getting inventory stats', { error });
        throw new AppError('InternalServerError', 500, 'Failed to fetch inventory statistics');
    }
};