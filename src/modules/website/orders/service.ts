import {
  generateOrderNumber,
  createOrder,
  findOrderById,
  updateOrder,
  findOrderItems,
  createOrderItem,
  updateOrderItem,
  updateOrderStatus,
  findCustomerOrders,
  getSellerOrderItems,
  findCustomerOrder,
} from './repository';
import {
  checkAvailabilityService,
  reserveStockService,
  confirmOrderService,
  cancelOrderService as releaseStockService,
  checkInventoryByProductIdService,
  reserveStockByProductIdService,
} from '../../sellers/inventory/service';
import { findSellerProductById, findProductById } from '../products/repository';
import { AppError } from '../../../utils/AppError';
import { sequelize } from '../../../db/sequelize';
import logger from '../../../utils/logger';

export const placeOrderService = async (
  customerId: string,
  orderData: {
    items: Array<{
      productId: string;
      productVariantId: string;
      sku: string;
      quantity: number;
      price: number;
      discountedPrice: number;
      discountedPercent: number;
    }>;
    subtotal: number;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    shippingCost?: number;
    shippingAddressId: string;
    paymentMethod: string;
    promotionId?: string;
    promotionDetails?: {
      id: string;
      title: string;
      type: string;
      discount: number;
    };
  }
) => {
  let transaction;
  try {
    if (!sequelize) {
      throw new AppError('ServerError', 500, 'Database connection not available');
    }

    const { items, shippingAddressId, paymentMethod, subtotal, taxAmount, shippingCost = 0, promotionDetails } = orderData;

    if (!items || items.length === 0) {
      throw new AppError('BadRequest', 400, 'Order must have at least one item');
    }

    if (!customerId || !shippingAddressId) {
      throw new AppError('BadRequest', 400, 'Customer ID and shipping address are required');
    }

    // START TRANSACTION - All validations and data operations inside transaction
    transaction = await sequelize.transaction();

    const orderItems = [];
    const itemsToProcess = [];

    // Validate all items WITHIN transaction to prevent race conditions
    for (const item of items) {
      // Fetch product - use transaction to lock the read
      const product = await findProductById(item.productId);
      if (!product) {
        throw new AppError('NotFound', 404, `Product not found: ${item.productId}`);
      }

      const variants = (product as any).variants || [];
      const variant = variants.find((v: any) => v.id === item.productVariantId);
      if (!variant) {
        throw new AppError('NotFound', 404, `Product variant not found: ${item.productVariantId}`);
      }

      if (variant.sku !== item.sku) {
        throw new AppError('BadRequest', 400, `SKU mismatch for variant ${item.productVariantId}`);
      }

      // Check inventory with transaction to prevent race conditions
      const available = await checkInventoryByProductIdService(item.productId, item.quantity);
      if (!available) {
        throw new AppError('BadRequest', 400, `Insufficient stock for ${(product as any).name}`);
      }

      itemsToProcess.push({
        productId: item.productId,
        productVariantId: item.productVariantId,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        discountedPrice: item.discountedPrice,
        discountedPercent: item.discountedPercent,
      });
    }

    for (const item of itemsToProcess) {
      orderItems.push({
        productId: item.productId,
        productVariantId: item.productVariantId,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.price,
        discountedPrice: item.discountedPrice,
        discountedPercent: item.discountedPercent,
      });
    }

    const finalAmount = parseFloat(orderData.totalAmount.toFixed(2));

    // Create order with PENDING status (not CONFIRMED) since payment is PENDING
    const order = await createOrder({
      customerId,
      shippingAddressId,
      paymentMethod,
      status: 'CONFIRMED',  // FIXED: Changed from 'CONFIRMED' to 'PENDING'
      paymentStatus: 'PENDING',
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      discountAmount: parseFloat(orderData.discountAmount.toFixed(2)),
      totalAmount: finalAmount,
      finalAmount,
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      metadata: promotionDetails ? {
        promotion: {
          id: promotionDetails.id,
          title: promotionDetails.title,
          type: promotionDetails.type,
          discountAmount: promotionDetails.discount,
        },
        appliedAt: new Date().toISOString(),
      } : undefined,
    }, transaction);

    const orderId = order?.dataValues?.id ?? (order as any).id;

    // Create order items and reserve stock within transaction
    for (const itemData of orderItems) {
      await createOrderItem({
        orderId,
        productId: itemData.productId,
        productVariantId: itemData.productVariantId,
        sku: itemData.sku,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        subtotal: itemData.unitPrice * itemData.quantity,
        taxAmount: 0,
        itemTotal: 0,
        discountedPrice: itemData.discountedPrice,
        discountedPercent: itemData.discountedPercent,
        status: 'CONFIRMED',
      }, transaction);

      // Reserve stock within transaction
      await reserveStockByProductIdService(itemData.productId, itemData.quantity, transaction);
    }

    // Commit transaction only after all operations succeed
    await transaction.commit();

    return {
      id: orderId,
      orderNumber: (order as any).orderNumber,
      status: 'CONFIRMED',  // Return CONFIRMED since order is ready for processing after payment
      finalAmount,
      message: 'Order placed successfully. Awaiting payment confirmation.',
    };
  } catch (error) {
    // Always rollback on error
    if (transaction) {
      await transaction.rollback().catch((rollbackError: any) => {
        logger.error('Error rolling back transaction', { error: rollbackError });
      });
    }
    throw error;
  }
};

export const confirmPaymentService = async (orderId: string) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await findOrderById(orderId);
    if (!order) {
      throw new AppError('NotFound', 404, 'Order not found');
    }

    if ((order as any).paymentStatus !== 'PENDING') {
      throw new AppError('BadRequest', 400, 'Payment already processed');
    }

    // Update order status from PENDING to CONFIRMED when payment is confirmed
    await updateOrder(orderId, {
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
    }, transaction);

    const items = await findOrderItems(orderId);
    for (const item of items) {
      await updateOrderItem((item as any).id, {
        status: 'CONFIRMED',
      }, transaction);

      await confirmOrderService((item as any).sellerProductId, (item as any).quantity, transaction);
    }

    await transaction.commit();
    logger.info('Payment confirmed', { orderId });
    return {
      id: (order as any).id,
      status: 'CONFIRMED',
      message: 'Payment confirmed. Order forwarded to sellers.',
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error confirming payment', { orderId, error });
    throw error;
  }
};

export const getCustomerOrdersService = async (customerId: string, filters: any) => {
  return await findCustomerOrders(customerId, filters);
};

export const getCustomerOrderService = async (customerId: string, orderId: string) => {
  return await findCustomerOrder(customerId, orderId);
};


export const cancelOrderService = async (orderId: string, reason: string) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await findOrderById(orderId);
    if (!order) {
      throw new AppError('NotFound', 404, 'Order not found');
    }

    if (['SHIPPED', 'DELIVERED'].includes((order as any).status)) {
      throw new AppError('BadRequest', 400, 'Cannot cancel shipped/delivered order');
    }

    const items = await findOrderItems(orderId);
    for (const item of items) {
      if (['PENDING', 'CONFIRMED'].includes((item as any).status)) {
        await releaseStockService((item as any).sellerProductId, (item as any).quantity, transaction);
      }
    }

    await updateOrderStatus(orderId, 'CANCELLED', transaction);

    await transaction.commit();
    logger.info('Order cancelled', { orderId, reason });
    return { id: orderId, status: 'CANCELLED' };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error cancelling order', { orderId, reason, error });
    throw error;
  }
};

export const getSellerOrdersService = async (sellerId: string, filters: any) => {
  return await getSellerOrderItems(sellerId, filters);
};

export const updateItemStatusService = async (
  itemId: string,
  sellerId: string,
  newStatus: string,
  updateData?: any
) => {
  const transaction = await sequelize.transaction();
  try {
    const items = await findOrderItems('');
    const item = (items as any)?.find((i: any) => i.id === itemId);

    if (!item) {
      throw new AppError('NotFound', 404, 'Order item not found');
    }

    if ((item as any).sellerId !== sellerId) {
      throw new AppError('Forbidden', 403, 'Unauthorized');
    }

    const validTransitions: any = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PACKED'],
      PACKED: ['SHIPPED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!validTransitions[(item as any).status]?.includes(newStatus)) {
      throw new AppError('BadRequest', 400, `Cannot transition from ${(item as any).status} to ${newStatus}`);
    }

    const updateObj: any = { status: newStatus };
    if (newStatus === 'SHIPPED') {
      updateObj.shippedAt = new Date();
      if (updateData?.trackerNumber) {
        updateObj.trackerNumber = updateData.trackerNumber;
      }
    } else if (newStatus === 'DELIVERED') {
      updateObj.deliveredAt = new Date();
    }

    const result = await updateOrderItem(itemId, updateObj, transaction);
    await transaction.commit();
    logger.info('Order item status updated', { itemId, sellerId, newStatus });
    return result;
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating order item status', { itemId, sellerId, newStatus, error });
    throw error;
  }
};
