import { Request, Response, NextFunction } from 'express';
import {
  getInventoryService,
  updateStockService,
  checkAvailabilityService,
} from './service';

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
