import {
  generateOrderNumber,
  createOrder,
  findOrderById,
  updateOrder,
  findOrderItems,
  findOrderItemById,
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
import { resolveR2Url } from '../../admin/products/transformer';
import { getOrCreateCustomer, findCustomerByEmail, findCustomerByPhone } from '../guests/customer.service';
import { findOrCreateCustomerAddress } from './shipping-address.repository';
import { AppError } from '../../../utils/AppError';
import { withTransaction } from '../../../utils/transaction';
import logger from '../../../utils/logger';
import { Promotion } from '../../../models';

export const placeOrderService = async (
  customerId: string | undefined,
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
    shippingAddressId?: string;
    shippingAddress?: {
      name: string;
      email: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    paymentMethod: string;
    promotionId?: string;
    promotionDetails?: {
      id: string;
      title: string;
      type: string;
      discount: number;
    };
  },
  guestData?: {
    contact?: string;
    contactType: 'email' | 'phone' | 'whatsapp';
  }
) => {
  return withTransaction(async (transaction) => {
    const { items, paymentMethod, subtotal, taxAmount, shippingCost = 0, promotionDetails, shippingAddress, shippingAddressId, promotionId } = orderData;

    if (!items || items.length === 0) {
      throw new AppError('BadRequest', 400, 'Order must have at least one item');
    }

    if (!shippingAddressId && !shippingAddress) {
      throw new AppError('BadRequest', 400, 'Shipping address is required');
    }

    if (!customerId && !guestData) {
      throw new AppError('BadRequest', 400, 'Customer or guest information is required');
    }

    const orderItems = [];
    const itemsToProcess = [];

    // Validate all items WITHIN transaction to prevent race conditions
    for (const item of items) {
      // Fetch product - use transaction to lock the read
      const product = await findProductById(item.productId, transaction);
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
      const available = await checkInventoryByProductIdService(item.productId, item.productVariantId, item.quantity, transaction);
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

    // Handle customer and shipping address for both logged-in and guest users
    let finalCustomerId = customerId;
    let finalShippingAddressId = shippingAddressId;

    if (!customerId && guestData) {
      // Guest checkout flow: find or create customer
      // Extract contact information from guestData
      const guestEmail = guestData.contactType === 'email' ? guestData.contact : undefined;
      const guestPhone = guestData.contactType === 'phone' ? guestData.contact : undefined;
      const guestWhatsapp = guestData.contactType === 'whatsapp' ? guestData.contact : undefined;

      // Check if customer already exists by email, phone, or whatsapp
      let existingCustomer = null;

      if (guestEmail) {
        existingCustomer = await findCustomerByEmail(guestEmail, transaction);
      }
      if (!existingCustomer && guestPhone) {
        existingCustomer = await findCustomerByPhone(guestPhone, transaction);
      }

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
        logger.info('Existing customer found for guest checkout', {
          customerId: finalCustomerId,
          email: guestEmail,
          phone: guestPhone,
          whatsapp: guestWhatsapp,
        });
      } else {
        // Create new customer
        finalCustomerId = await getOrCreateCustomer(
          guestEmail,
          guestPhone,
          guestWhatsapp,
          undefined,
          transaction,
        );
        logger.info('New guest customer created', {
          customerId: finalCustomerId,
          email: guestEmail,
          phone: guestPhone,
          whatsapp: guestWhatsapp,
        });
      }
    }

    // Handle shipping address for both logged-in and guest customers
    if (!finalShippingAddressId && shippingAddress && finalCustomerId) {
      logger.info('Processing shipping address for customer', {
        customerId: finalCustomerId,
        addressLine1: shippingAddress.addressLine1,
        city: shippingAddress.city,
      });

      try {
        // Find or create shipping address for the customer
        const shippingAddressRecord = await findOrCreateCustomerAddress(
          finalCustomerId,
          {
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            addressLine1: shippingAddress.addressLine1,
            addressLine2: shippingAddress.addressLine2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode.toString(),
            country: shippingAddress.country,
          },
          transaction
        );

        finalShippingAddressId = shippingAddressRecord.id;

        logger.info('Shipping address resolved for customer', {
          customerId: finalCustomerId,
          shippingAddressId: finalShippingAddressId,
          isNew: shippingAddressRecord.createdAt,
        });
      } catch (addressError) {
        logger.error('Error handling shipping address', {
          customerId: finalCustomerId,
          error: addressError,
        });
        throw new AppError(
          'ServerError',
          500,
          'Failed to process shipping address'
        );
      }
    }

    // Validate that we have a shipping address ID after processing
    if (!finalShippingAddressId) {
      throw new AppError(
        'BadRequest',
        400,
        'Shipping address could not be resolved'
      );
    }

    // Build guest email/phone based on contact type for legacy support
    const guestEmail = guestData && guestData.contactType === 'email' ? guestData.contact : undefined;
    const guestPhone = guestData && guestData.contactType === 'phone' ? guestData.contact : undefined;

    let promotionInfo;
    if (promotionId) {
      promotionInfo = await Promotion.findByPk(promotionId,
        { raw: true, transaction }
      );
    }

    // Create order with PENDING status (not CONFIRMED) since payment is PENDING
    const order = await createOrder({
      customerId: finalCustomerId,
      guestEmail,
      guestPhone,
      shippingAddressId: finalShippingAddressId,
      paymentMethod,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      discountAmount: parseFloat(orderData.discountAmount.toFixed(2)),
      totalAmount: parseFloat(orderData.subtotal.toFixed(2)),
      finalAmount,
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      metadata: (promotionInfo || promotionDetails) ? {
        promotion: {
          id: promotionInfo?.id || promotionDetails?.id,
          title: promotionInfo?.title || promotionDetails?.title,
          type: promotionInfo?.type || promotionDetails?.type,
          discountAmount: promotionDetails?.discount ?? null,
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
      await reserveStockByProductIdService(itemData.productId, itemData?.productVariantId, itemData.quantity, transaction);
    }

    return {
      id: orderId,
      orderNumber: (order as any).orderNumber,
      customerId: finalCustomerId,
      status: 'CONFIRMED',
      finalAmount,
      message: 'Order placed successfully. Awaiting payment confirmation.',
    };
  });
};

export const confirmPaymentService = async (orderId: string) => {
  return withTransaction(async (transaction) => {
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

      await confirmOrderService((item as any).productId, item?.productVariantId, (item as any).quantity, transaction);
    }

    logger.info('Payment confirmed', { orderId });
    return {
      id: (order as any).id,
      status: 'CONFIRMED',
      message: 'Payment confirmed. Order forwarded to sellers.',
    };
  });
};

export const getCustomerOrdersService = async (customerId: string, filters: any, customerEmail?: string) => {
  return await findCustomerOrders(customerId, filters, customerEmail);
};

export const getCustomerOrderService = async (customerId: string, orderId: string, customerEmail?: string) => {
  const order: any = await findCustomerOrder(customerId, orderId, customerEmail);

  if (!order) {
    throw new AppError('NotFound', 404, 'Order not found');
  }

  // Process items to resolve R2 URLs for product images
  if (order?.items && Array.isArray(order.items)) {
    await Promise.all(
      order.items.map(async (item: any) => {
        if (item?.productImage) {
          try {
            item.productImage = await resolveR2Url(item.productImage);
          } catch (err) {
            logger.warn('Failed to resolve product image for order item', {
              itemId: item.id,
              error: err,
            });
            item.productImage = '';
          }
        }
      }),
    );
  }

  return order;
};


export const cancelOrderService = async (orderId: string, reason: string, customerId?: string) => {
  return withTransaction(async (transaction) => {
    const order = await findOrderById(orderId);
    if (!order) {
      throw new AppError('NotFound', 404, 'Order not found');
    }

    // Validate that the order belongs to the logged-in customer
    if (customerId && (order as any).customerId !== customerId) {
      throw new AppError('Forbidden', 403, 'You do not have permission to cancel this order');
    }

    if (['SHIPPED', 'DELIVERED'].includes((order as any).status)) {
      throw new AppError('BadRequest', 400, 'Cannot cancel shipped/delivered order');
    }

    const items = await findOrderItems(orderId);
    for (const item of items) {
      if (['PENDING', 'CONFIRMED'].includes((item as any).status)) {
        await releaseStockService((item as any).productId, item?.productVariantId, (item as any).quantity, transaction);
      }
      await updateOrderItem((item as any).id, {
        status: 'CANCELLED',
      }, transaction);
    }

    await updateOrderStatus(orderId, 'CANCELLED', transaction);

    logger.info('Order cancelled', { orderId, customerId, reason });
    return { id: orderId, status: 'CANCELLED' };
  });
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
  return withTransaction(async (transaction) => {
    const item = await findOrderItemById(itemId, transaction);

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
    switch (newStatus) {
      case 'SHIPPED':
        updateObj.shippedAt = new Date();
        if (updateData?.trackerNumber) {
          updateObj.trackerNumber = updateData.trackerNumber;
        }
        break;
      case 'DELIVERED':
        updateObj.deliveredAt = new Date();
        break;
    }

    const result = await updateOrderItem(itemId, updateObj, transaction);
    logger.info('Order item status updated', { itemId, sellerId, newStatus });
    return result;
  });
};
