import { Request, Response, NextFunction } from 'express';
import {
  placeOrderService,
  confirmPaymentService,
  getCustomerOrdersService,
  cancelOrderService,
  getSellerOrdersService,
  updateItemStatusService,
} from './service';
import { findById } from '../../sellers/repository';
import { AppError } from '../../../utils/AppError';

export const placeOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const result = await placeOrderService(customerId, req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPaymentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await confirmPaymentService(id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    if (!customerId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const result = await getCustomerOrdersService(customerId, req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await cancelOrderService(id, reason);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerOrdersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const seller = await findById(userId);
    if (!seller) {
      throw new AppError('BadRequest', 400, 'You are not registered as a seller');
    }

    const result = await getSellerOrdersService(seller.id, req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const userId = req.session?.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const seller = await findById(userId);
    if (!seller) {
      throw new AppError('BadRequest', 400, 'You are not registered as a seller');
    }

    const { status } = req.body;

    if (!status) {
      throw new AppError('BadRequest', 400, 'Status is required');
    }

    const result = await updateItemStatusService(itemId, seller.id, status, req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
