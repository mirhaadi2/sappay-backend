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
  checkInventoryByProductIdService,
  reserveStockByProductIdService,
} from '../../sellers/inventory/service';
import { findSellerProductById, findProductById } from '../products/repository';
import { AppError } from '../../../utils/AppError';

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
  }
) => {
  const { items, shippingAddressId, paymentMethod, subtotal, taxAmount, shippingCost = 0 } = orderData;

  // ✅ Validation
  if (!items || items.length === 0) {
    throw new AppError('BadRequest', 400, 'Order must have at least one item');
  }

  if (!customerId || !shippingAddressId) {
    throw new AppError('BadRequest', 400, 'Customer ID and shipping address are required');
  }

  const orderItems = [];
  const itemsToProcess = [];

  // ✅ Step 1: Validate all products and variants exist, check stock
  for (const item of items) {
    // Fetch product
    const product = await findProductById(item.productId);
    if (!product) {
      throw new AppError('NotFound', 404, `Product not found: ${item.productId}`);
    }

    // ✅ Fetch variant
    const variants = (product as any).variants || [];
    const variant = variants.find((v: any) => v.id === item.productVariantId);
    if (!variant) {
      throw new AppError('NotFound', 404, `Product variant not found: ${item.productVariantId}`);
    }

    // ✅ Validate SKU matches
    if (variant.sku !== item.sku) {
      throw new AppError('BadRequest', 400, `SKU mismatch for variant ${item.productVariantId}`);
    }

    // ✅ Check stock availability
    const available = await checkInventoryByProductIdService(item.productId, item.quantity);
    if (!available) {
      throw new AppError('BadRequest', 400, `Insufficient stock for ${(product as any).name} (${variant.weight})`);
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

  // ✅ Step 2: Create order items with frontend-calculated data
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

  // ✅ Step 3: Use frontend-calculated totals
  const finalAmount = parseFloat(orderData.totalAmount.toFixed(2));
  const orderNumber = await generateOrderNumber();

  // ✅ Step 4: Create order with frontend-provided totals
  const order = await createOrder({
    orderNumber,
    customerId,
    shippingAddressId,
    paymentMethod,
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    discountAmount: parseFloat(orderData.discountAmount.toFixed(2)),
    totalAmount: finalAmount,
    finalAmount,
    shippingCost: parseFloat(shippingCost.toFixed(2)),
  });
console.log(order,'order')
  // ✅ Step 5: Create order items and reserve stock
  for (const itemData of orderItems) {
    await createOrderItem({
      orderId: order?.dataValues?.id ?? (order as any).id,
      productId: itemData.productId,
      productVariantId: itemData.productVariantId,
      sku: itemData.sku,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
      subtotal: itemData.unitPrice * itemData.quantity,
      taxAmount: 0, // Initialize tax amount
      itemTotal: 0, // Initialize item total
      discountedPrice: itemData.discountedPrice,
      discountedPercent: itemData.discountedPercent,
      status: 'PENDING',
    });

    // Reserve stock for this product
    await reserveStockByProductIdService(itemData.productId, itemData.quantity);
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
