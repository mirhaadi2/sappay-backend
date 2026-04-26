import { NextFunction, Response } from 'express';
import {
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminRefundOrder,
  adminCancelOrder,
  adminDisputeOrder,
} from './service';
import { AuthenticatedRequest } from '../middleware';
import logger from '../../../utils/logger';

export const listOrdersHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, status, sellerId, customerId, sortBy, sortOrder } = req.query;
    const result = await adminListOrders({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      status: (status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded') || undefined,
      sellerId: sellerId as string,
      customerId: customerId as string,
      sortBy: (sortBy as 'createdAt' | 'totalAmount') || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('List orders error', { error });
    next(error);
  }
};

export const getOrderHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await adminGetOrder(id);
    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Get order error', { error });
    next(error);
  }
};

export const updateOrderStatusHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, notes, trackingNumber, statusReason } = req.body;
    const staffId = req.staff?.id;
    const order = await adminUpdateOrderStatus(id, { status, trackingNumber, statusReason }, staffId);
    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Update order status error', { error });
    next(error);
  }
};

export const refundOrderHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body;
    const order = await adminRefundOrder(id, reason);
    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Refund order error', { error });
    next(error);
  }
};

export const cancelOrderHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await adminCancelOrder(id, reason);
    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Cancel order error', { error });
    next(error);
  }
};

export const disputeOrderHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, resolution } = req.body;
    const order = await adminDisputeOrder(id, resolution);
    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Dispute order error', { error });
    next(error);
  }
};
