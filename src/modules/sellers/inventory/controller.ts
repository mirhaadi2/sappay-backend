import { Request, Response, NextFunction } from 'express';
import {
  getInventoryService,
  updateStockService,
  checkAvailabilityService,
  getSellerInventoryService,
  logInventoryTransaction,
} from './service';
import { findById } from '../../sellers/repository';
import { AppError } from '../../../utils/AppError';
import logger from '../../../utils/logger';

export const getInventoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const inventory = await getInventoryService(id);
    res.json({ success: true, data: inventory });
  } catch (error: any) {
    logger.error('Get inventory error', { error });
    next(error);
  }
};

export const updateStockHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const inventory = await updateStockService(id, quantity);
    res.json({ success: true, data: inventory });
  } catch (error: any) {
    logger.error('Update stock error', { error });
    next(error);
  }
};

export const checkAvailabilityHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { quantity, productVariantId } = req.query;
    const available = await checkAvailabilityService(id, productVariantId as string, Number(quantity));
    res.json({ success: true, data: { available } });
  } catch (error: any) {
    logger.error('Check availability error', { error });
    next(error);
  }
};

export const getSellerInventoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sellerId = (req as any).sellerId;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Seller not authenticated');
    }

    const result = await getSellerInventoryService(sellerId, req.query);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Get seller inventory error', { error });
    next(error);
  }
};

export const addInventoryStockHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sellerProductId } = req.params;
    const { quantity, notes } = req.body;
    const sellerId = (req as any).sellerId;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Seller not authenticated');
    }

    const seller = await findById(sellerId);
    if (!seller) {
      throw new AppError('NotFound', 404, 'Seller not found');
    }

    if (!quantity || quantity <= 0) {
      throw new AppError('BadRequest', 400, 'Quantity must be greater than 0');
    }

    // Get current inventory
    const inventory = await getInventoryService(sellerProductId);

    const previousStock = inventory.totalStock;
    const newStock = previousStock + quantity;

    // Update inventory
    const updatedInventory = await updateStockService(sellerProductId, quantity);

    // Log the transaction
    await logInventoryTransaction(
      inventory.id,
      sellerProductId,
      'STOCK_ADDED',
      quantity,
      previousStock,
      newStock,
      undefined,
      notes || 'Stock added by seller'
    );

    res.status(201).json({
      success: true,
      data: updatedInventory,
      message: `Added ${quantity} units to inventory`
    });
  } catch (error: any) {
    logger.error('Add inventory stock error', { error });
    next(error);
  }
};

