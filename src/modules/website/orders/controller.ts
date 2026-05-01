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
import { sendEmail } from '../../../utils/sendEmail';
import { config } from '../../../config';
import logger from '../../../utils/logger';
import { Customer } from '../guests/customer.model';

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

    const result: any = await placeOrderService(
      customerId || undefined,
      req.body,
      guestData ? { contact: guestData?.contact, contactType: guestData.contactType } : undefined
    );
    res.status(201).json({
      success: true,
      data: result,
    });

    let customer = await Customer.findByPk(result.customerId, { raw: true });
    // Send notification to sales team
    try {
      await sendEmail(
        {
          to: config.email.salesTeamEmail,
          subject: 'New Order Notification',
          html: `<h2>New Order Placed</h2>
            <p><strong>Order Number:</strong> ${result?.orderNumber || result?.dataValues?.orderNumber}</p>
            <p><strong>Customer Email:</strong> ${customer?.email || 'Guest'}</p>
            <p><strong>Total Amount:</strong> ₹${result?.finalAmount || result?.dataValues?.finalAmount}</p>
            <p>Please check the admin panel for order details.</p>`
        });
      logger.info('Sales team notification sent', { orderId: result.id, orderNumber: result.orderNumber });
    } catch (error) {
      logger.error('Failed to send sales team notification', { error, orderId: result.id });
    }

    // Send confirmation to customer
    if (customer?.email) {
      try {
        await sendEmail(
          {
            to: customer.email,
            subject: 'Order Confirmation - Sappay',
            html:`<h2>Order Confirmation</h2>
              <p>Thank you for shopping with us!</p>
              <p><strong>Order Number:</strong> ${result?.orderNumber || result?.dataValues?.orderNumber}</p>
              <p><strong>Total Amount:</strong> ₹${result?.finalAmount || result?.dataValues?.finalAmount}</p>
              <p>Your order has been placed successfully. Our sales team will contact you shortly for payment and delivery details.</p>
              <p>If you have any questions, please reply to this email.</p>`,
            from: config.email.salesTeamEmail,
            fromMailType: 'sales'
          });
        logger.info('Customer confirmation email sent', { orderId: result.id, customerEmail: customer.email });
      } catch (error) {
        logger.error('Failed to send customer confirmation', { error, orderId: result.id, customerEmail: customer.email });
      }
    }
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
