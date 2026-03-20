import { Request, Response, NextFunction } from 'express';
import {
  getInventoryService,
  updateStockService,
  checkAvailabilityService,
  getSellerInventoryService,
  getInventoryHistoryService,
  getSellerInventoryHistoryService,
  logInventoryTransaction,
} from './service';
import { findById } from '../sellers/repository';

export const getInventoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const inventory = await getInventoryService(id);
    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

export const updateStockHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const inventory = await updateStockService(id, quantity);
    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

export const checkAvailabilityHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { quantity } = req.query;
    const available = await checkAvailabilityService(id, Number(quantity));
    res.json({ success: true, data: { available } });
  } catch (error) {
    next(error);
  }
};

export const getSellerInventoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new Error('Unauthorized: Please login first');
    }

    const result = await getSellerInventoryService(userId, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getInventoryHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerProductId } = req.params;
    const result = await getInventoryHistoryService(sellerProductId, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getSellerInventoryHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new Error('Unauthorized: Please login first');
    }

    const result = await getSellerInventoryHistoryService(userId, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const addInventoryStockHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerProductId } = req.params;
    const { quantity, notes } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      throw new Error('Unauthorized: Please login first');
    }

    const seller = await findById(userId);
    if (!seller) {
      throw new Error('Not registered as seller');
    }

    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
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

    res.json({ 
      success: true, 
      data: updatedInventory,
      message: `Added ${quantity} units to inventory` 
    });
  } catch (error) {
    next(error);
  }
};

