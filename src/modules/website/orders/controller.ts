import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  placeOrderService,
  confirmPaymentService,
  getCustomerOrdersService,
  cancelOrderService,
  getSellerOrdersService,
  updateItemStatusService,
  getCustomerOrderService,
} from './service';
import { findOrderByGatewayOrderId, findOrderById } from './repository';
import { findById } from '../../sellers/repository';
import { AppError } from '../../../utils/AppError';
import { sendEmail, sendNewOrderNotificationEmail, sendOrderConfirmationEmail } from '../../../utils/sendEmail';
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
    const isPrepaid = result.paymentMethod !== 'cod';
    // Send notification to sales team
    try {
      if (!isPrepaid) {
        await sendNewOrderNotificationEmail(
          result?.orderNumber || result?.dataValues?.orderNumber,
          customer?.email || 'Guest',
          result?.finalAmount || result?.dataValues?.finalAmount,
          'support'
        );
      }
      logger.info('Sales team notification sent', { orderId: result.id, orderNumber: result.orderNumber });
    } catch (error) {
      logger.error('Failed to send sales team notification', { error, orderId: result.id });
    }

    // Send confirmation to customer
    if (!isPrepaid && customer?.email) {
      try {
        await sendOrderConfirmationEmail(
          customer.email,
          result?.orderNumber || result?.dataValues?.orderNumber,
          result?.finalAmount || result?.dataValues?.finalAmount,
          'sales'
        );
      } catch (error) {
        logger.error('Failed to send sales team notification', { error, orderId: result.id });
      }
    }
  } catch (error) {
    next(error);
  }
};

interface RazorpayPaymentConfirmationPayload {
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

const verifyRazorpayCheckoutSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  if (!config.payment.apiSecret) {
    throw new AppError('ServiceUnavailable', 503, 'Payment gateway secret is not configured');
  }

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.payment.apiSecret)
    .update(payload)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new AppError('BadRequest', 400, 'Invalid Razorpay payment signature');
  }
};

export const confirmPaymentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body as RazorpayPaymentConfirmationPayload;

    if (razorpayPaymentId || razorpayOrderId || razorpaySignature) {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        throw new AppError('BadRequest', 400, 'Invalid Razorpay confirmation payload');
      }

      const order = await findOrderById(id);
      if (!order) {
        throw new AppError('NotFound', 404, 'Order not found');
      }

      const gatewayOrderId = (order as any).metadata?.payment?.gatewayOrderId;
      if (gatewayOrderId !== razorpayOrderId) {
        throw new AppError('BadRequest', 400, 'Razorpay order id does not match local order');
      }

      verifyRazorpayCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    }

    const result = await confirmPaymentService(id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const webhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    if (!signature) {
      throw new AppError('BadRequest', 400, 'Missing Razorpay webhook signature');
    }

    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.payment.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new AppError('BadRequest', 400, 'Invalid Razorpay webhook signature');
    }

    const event = JSON.parse(rawBody);
    const razorpayOrderId = event?.payload?.payment?.entity?.order_id;
    if (!razorpayOrderId) {
      throw new AppError('BadRequest', 400, 'Missing Razorpay order reference');
    }

    const order = await findOrderByGatewayOrderId(razorpayOrderId);
    if (!order) {
      throw new AppError('NotFound', 404, 'Order not found for Razorpay payment');
    }

    if (event.event === 'payment.captured') {
      try {
        await confirmPaymentService((order as any).id);
      } catch (webhookError: any) {
        if (webhookError instanceof AppError && webhookError.name === 'BadRequest' && webhookError.statusCode === 400) {
          return res.json({ success: true });
        }
        throw webhookError;
      }
    }

    res.json({ success: true });
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
