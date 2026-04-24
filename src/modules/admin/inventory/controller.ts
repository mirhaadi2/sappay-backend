import { Response } from 'express';
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

/**
 * List inventory with filtering and pagination
 */
export const listInventoryHandler = async (req: AuthenticatedRequest, res: Response) => {
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
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};

/**
 * Get inventory for a specific product
 */
export const getProductInventoryHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { productId } = req.params;
        const inventory = await adminGetProductInventory(productId);
        res.json({ success: true, data: inventory });
    } catch (error: any) {
        logger.error('Get product inventory error', { error, productId: req.params.productId });
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};

/**
 * Update inventory item
 */
export const updateInventoryHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { inventoryId } = req.params;
        const { totalStock, availableStock, reorderLevel, notes } = req.body;

        // Validate input
        if (totalStock !== undefined && (isNaN(totalStock) || totalStock < 0)) {
            return res.status(400).json({ success: false, error: 'Invalid total stock value' });
        }

        if (availableStock !== undefined && (isNaN(availableStock) || availableStock < 0)) {
            return res.status(400).json({ success: false, error: 'Invalid available stock value' });
        }

        if (reorderLevel !== undefined && (isNaN(reorderLevel) || reorderLevel < 0)) {
            return res.status(400).json({ success: false, error: 'Invalid reorder level value' });
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
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};

/**
 * Add stock to inventory
 */
export const addStockHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { inventoryId } = req.params;
        const { quantity, notes } = req.body;

        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ success: false, error: 'Valid quantity is required' });
        }

        const inventory = await adminAddStock(inventoryId, { quantity: Number(quantity), notes });
        res.json({ success: true, data: inventory });
    } catch (error: any) {
        logger.error('Add stock error', { error, inventoryId: req.params.inventoryId });
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};

/**
 * Remove stock from inventory
 */
export const removeStockHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { inventoryId } = req.params;
        const { quantity, reason, notes } = req.body;

        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ success: false, error: 'Valid quantity is required' });
        }

        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Reason is required' });
        }

        const inventory = await adminRemoveStock(inventoryId, {
            quantity: Number(quantity),
            reason: reason.trim(),
            notes
        });

        res.json({ success: true, data: inventory });
    } catch (error: any) {
        logger.error('Remove stock error', { error, inventoryId: req.params.inventoryId });
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};

/**
 * Get inventory history
 */
export const getInventoryHistoryHandler = async (req: AuthenticatedRequest, res: Response) => {
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
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};

/**
 * Get inventory statistics
 */
export const getInventoryStatsHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const stats = await adminGetInventoryStats();
        res.json({ success: true, data: stats });
    } catch (error: any) {
        logger.error('Get inventory stats error', { error });
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};