import { Request, Response } from 'express';
import { getInventoryHistory, getSellerInventoryHistory } from './repository';
import { AppError } from '../../../../utils/AppError';
import logger from '../../../../utils/logger';

export const getInventoryHistoryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { sellerProductId } = req.params;
    const result = await getInventoryHistory(sellerProductId, req.query);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Get inventory history error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

export const getSellerInventoryHistoryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const sellerId = (req as any).sellerId;

    if (!sellerId) {
      throw new AppError('Unauthorized', 401, 'Seller not authenticated');
    }

    const result = await getSellerInventoryHistory(sellerId, req.query);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Get seller inventory history error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};