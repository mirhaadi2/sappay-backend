import { NextFunction, Response } from 'express';
import {
    adminListInventory,
    adminGetProductInventory,
    adminUpdateInventory,
    adminAddStock,
    adminRemoveStock,
    adminGetInventoryHistory,
    adminGetInventoryStats,
} from './service';
import { AuthenticatedRequest } from '../middleware';
import logger from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

/**
 * List inventory with filtering and pagination
 */
export const listInventoryHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const {
            page = 1,
            limit = 20,
            productId,
            sellerId,
            lowStock,
            search,
        } = req.query;

        const result = await adminListInventory({
            page: Number(page),
            limit: Number(limit),
            productId: productId as string,
            sellerId: sellerId as string,
            lowStock: lowStock === 'true',
            search: search as string,
        });

        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('List inventory error', { error });
        next(error);
    }
};

/**
 * Get inventory for a specific product
 */
export const getProductInventoryHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const inventory = await adminGetProductInventory(productId);
        res.json({ success: true, data: inventory });
    } catch (error: any) {
        logger.error('Get product inventory error', { error, productId: req.params.productId });
        next(error);
    }
};

/**
 * Update inventory item
 */
export const updateInventoryHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { inventoryId } = req.params;
        const { totalStock, availableStock, reorderLevel, notes } = req.body;

        // Validate input
        if (totalStock !== undefined && (isNaN(totalStock) || totalStock < 0)) {
            throw new AppError('ValidationError', 400, 'Invalid total stock value');
        }

        if (availableStock !== undefined && (isNaN(availableStock) || availableStock < 0)) {
            throw new AppError('ValidationError', 400, 'Invalid available stock value');
        }

        if (reorderLevel !== undefined && (isNaN(reorderLevel) || reorderLevel < 0)) {
            throw new AppError('ValidationError', 400, 'Invalid reorder level value');
        }

        const inventory = await adminUpdateInventory(inventoryId, {
            totalStock,
            availableStock,
            reorderLevel,
            notes,
        });

        res.json({ success: true, data: inventory });
    } catch (error: any) {
        logger.error('Update inventory error', { error, inventoryId: req.params.inventoryId });
        next(error);
    }
};

/**
 * Add stock to inventory
 */
export const addStockHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { inventoryId } = req.params;
        const { quantity, notes } = req.body;

        if (!quantity || isNaN(quantity) || quantity <= 0) {
            throw new AppError('ValidationError', 400, 'Valid quantity is required');
        }

        const inventory = await adminAddStock(inventoryId, { quantity: Number(quantity), notes });
        res.json({ success: true, data: inventory });
    } catch (error: any) {
        logger.error('Add stock error', { error, inventoryId: req.params.inventoryId });
        next(error);
    }
};

/**
 * Remove stock from inventory
 */
export const removeStockHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { inventoryId } = req.params;
        const { quantity, reason, notes } = req.body;

        if (!quantity || isNaN(quantity) || quantity <= 0) {
            throw new AppError('ValidationError', 400, 'Valid quantity is required');
        }

        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            throw new AppError('ValidationError', 400, 'Reason is required');
        }

        const inventory = await adminRemoveStock(inventoryId, {
            quantity: Number(quantity),
            reason: reason.trim(),
            notes
        });

        res.json({ success: true, data: inventory });
    } catch (error: any) {
        logger.error('Remove stock error', { error, inventoryId: req.params.inventoryId });
        next(error);
    }
};

/**
 * Get inventory history
 */
export const getInventoryHistoryHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const { productId, sellerId, inventoryId } = req.query;

        const result = await adminGetInventoryHistory(Number(page), Number(limit), {
            productId: productId as string,
            sellerId: sellerId as string,
            inventoryId: inventoryId as string,
        });

        res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Get inventory history error', { error });
        next(error);
    }
};

/**
 * Get inventory statistics
 */
export const getInventoryStatsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const stats = await adminGetInventoryStats();
        res.json({ success: true, data: stats });
    } catch (error: any) {
        logger.error('Get inventory stats error', { error });
        next(error);
    }
};