import { Request, Response, NextFunction } from 'express';
import {
  placeOrderService,
  confirmPaymentService,
  getCustomerOrdersService,
  cancelOrderService,
  getSellerOrdersService,
  updateItemStatusService,
  getCustomerOrderService,
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
    const guestData = req.guestCheckout;

    if (!customerId && !guestData) {
      throw new AppError('Unauthorized', 401, 'Please login first or verify OTP to continue');
    }

    const result = await placeOrderService(
      customerId || undefined,
      req.body,
      guestData ? { contact: guestData?.contact, contactType: guestData.contactType } : undefined
    );
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
    const customerEmail = (req.session?.user as any)?.email;
    if (!customerId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    const result = await getCustomerOrdersService(customerId, req.query, customerEmail);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.session?.user?.id;
    const customerEmail = (req.session?.user as any)?.email;
    const orderId = req.params.id;
    if (!customerId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }

    if (!orderId) {
      throw new AppError('BadRequest', 400, 'Order ID is required');
    }

    const result = await getCustomerOrderService(customerId, orderId, customerEmail);
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
    const customerId = req.session?.user?.id;
    
    if (!customerId) {
      throw new AppError('Unauthorized', 401, 'Please login first');
    }
    
    const result = await cancelOrderService(id, reason, customerId);
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
