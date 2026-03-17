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
} from './repository';
import {
  checkAvailabilityService,
  reserveStockService,
  confirmOrderService,
  cancelOrderService as releaseStockService,
} from '../inventory/service';
import { findSellerProductById, findProductById } from '../products/repository';
import { AppError } from '../../utils/AppError';

export const placeOrderService = async (
  customerId: string,
  orderData: {
    items: Array<{
      sellerProductId: string;
      quantity: number;
    }>;
    shippingAddressId: string;
    paymentMethod: string;
  }
) => {
  const { items, shippingAddressId, paymentMethod } = orderData;

  if (!items || items.length === 0) {
    throw new AppError('BadRequest', 400, 'Order must have at least one item');
  }

  let totalAmount = 0;
  let totalTax = 0;
  const orderItems = [];

  for (const item of items) {
    const sellerProduct = await findSellerProductById(item.sellerProductId);
    if (!sellerProduct) {
      throw new AppError('NotFound', 404, `Product not found: ${item.sellerProductId}`);
    }

    const available = await checkAvailabilityService(item.sellerProductId, item.quantity);
    if (!available) {
      throw new AppError('BadRequest', 400, 'Insufficient stock for one or more items');
    }

    const subtotal = (sellerProduct as any).sellerPrice * item.quantity;
    const product = await findProductById((sellerProduct as any).productId);
    const tax = (subtotal * ((product as any)?.gst_rate || 18)) / 100;

    totalAmount += subtotal;
    totalTax += tax;

    orderItems.push({
      sellerProductId: item.sellerProductId,
      sellerId: (sellerProduct as any).sellerId,
      quantity: item.quantity,
      unitPrice: (sellerProduct as any).sellerPrice,
      subtotal,
      taxAmount: tax,
      itemTotal: subtotal + tax,
    });
  }

  const finalAmount = totalAmount + totalTax;
  const orderNumber = await generateOrderNumber();
  const order = await createOrder({
    orderNumber,
    customerId,
    shippingAddressId,
    paymentMethod,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    totalAmount,
    taxAmount: totalTax,
    finalAmount,
    shippingCost: 0,
  });

  for (const itemData of orderItems) {
    await createOrderItem({
      ...itemData,
      orderId: (order as any).id,
    });

    await reserveStockService(itemData.sellerProductId, itemData.quantity);
  }

  return {
    id: (order as any).id,
    orderNumber: (order as any).orderNumber,
    status: (order as any).status,
    finalAmount,
    message: 'Order placed successfully. Awaiting payment confirmation.',
  };
};

export const confirmPaymentService = async (orderId: string) => {
  const order = await findOrderById(orderId);
  if (!order) {
    throw new AppError('NotFound', 404, 'Order not found');
  }

  if ((order as any).paymentStatus !== 'PENDING') {
    throw new AppError('BadRequest', 400, 'Payment already processed');
  }

  await updateOrder(orderId, {
    status: 'CONFIRMED',
    paymentStatus: 'COMPLETED',
  });

  const items = await findOrderItems(orderId);
  for (const item of items) {
    await updateOrderItem((item as any).id, {
      status: 'CONFIRMED',
    });

    await confirmOrderService((item as any).sellerProductId, (item as any).quantity);
  }

  return {
    id: (order as any).id,
    status: (order as any).status,
    message: 'Payment confirmed. Order forwarded to sellers.',
  };
};

export const getCustomerOrdersService = async (customerId: string, filters: any) => {
  return await findCustomerOrders(customerId, filters);
};

export const cancelOrderService = async (orderId: string, reason: string) => {
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
      await releaseStockService((item as any).sellerProductId, (item as any).quantity);
    }
  }

  await updateOrderStatus(orderId, 'CANCELLED');

  return { id: orderId, status: 'CANCELLED' };
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

  return await updateOrderItem(itemId, updateObj);
};
