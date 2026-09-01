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
import { recordCouponUsage } from '../../coupons/service';
import { findSellerProductById, findProductById } from '../products/repository';
import { resolveR2Url } from '../../admin/products/transformer';
import {
    getOrCreateCustomer,
    findCustomerByEmail,
    findCustomerByPhone,
    findCustomerById,
} from '../guests/customer.service';
import { findOrCreateCustomerAddress } from './shipping-address.repository';
import { AppError } from '../../../utils/AppError';
import { config } from '../../../config';
import axios from 'axios';
import { withTransaction } from '../../../utils/transaction';
import logger from '../../../utils/logger';
import {
    sendEmail,
    sendNewOrderNotificationEmail,
    sendOrderConfirmationEmail,
} from '../../../utils/sendEmail';
import { findCustomerByIdRecord, findPromotionByIdRecord } from './repository';

const isPrepaidPaymentMethod = (paymentMethod: string) => paymentMethod !== 'cod';

const createPaymentGatewayOrder = async (
    paymentMethod: string,
    amountInPaise: number,
    receipt: string,
) => {
    if (!isPrepaidPaymentMethod(paymentMethod)) return undefined;

    if (!config.payment.provider || config.payment.provider === 'none') {
        throw new AppError(
            'ServiceUnavailable',
            503,
            'Payment gateway is not configured. Set PAYMENT_PROVIDER, PAYMENT_API_KEY, and PAYMENT_API_SECRET in .env',
        );
    }

    if (!config.payment.apiKey || !config.payment.apiSecret) {
        throw new AppError(
            'ServiceUnavailable',
            503,
            'Payment provider credentials are missing. Set PAYMENT_API_KEY and PAYMENT_API_SECRET in .env',
        );
    }

    const provider = config.payment.provider.toLowerCase();
    if (provider === 'razorpay') {
        const auth = Buffer.from(`${config.payment.apiKey}:${config.payment.apiSecret}`).toString(
            'base64',
        );
        const response = await axios.post(
            'https://api.razorpay.com/v1/orders',
            {
                amount: amountInPaise,
                currency: 'INR',
                receipt,
                payment_capture: 1,
                notes: { paymentMethod },
            },
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            },
        );

        return {
            provider: 'razorpay',
            gatewayOrderId: response.data?.id,
            publicKey: config.payment.apiKey,
            rawResponse: response.data,
        };
    }

    throw new AppError(
        'ServiceUnavailable',
        503,
        `Configured payment provider "${config.payment.provider}" is not supported`,
    );
};

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
        paymentDetails?: {
            upiId?: string;
            netbankingBank?: string;
        };
        couponId?: string;
        couponCode?: string;
        couponType?: string;
        couponDiscount?: number;
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
    },
) => {
    return withTransaction(async (transaction) => {
        const {
            items,
            paymentMethod,
            subtotal,
            taxAmount,
            shippingCost = 0,
            promotionDetails,
            shippingAddress,
            shippingAddressId,
            promotionId,
            paymentDetails,
        } = orderData;

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

        const finalAmount = Math.round(orderData.totalAmount);
        const totalDiscount = parseFloat(
            (orderData.discountAmount + (orderData.couponDiscount || 0)).toFixed(2),
        );

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
                throw new AppError(
                    'NotFound',
                    404,
                    `Product variant not found: ${item.productVariantId}`,
                );
            }

            if (variant.sku !== item.sku) {
                throw new AppError(
                    'BadRequest',
                    400,
                    `SKU mismatch for variant ${item.productVariantId}`,
                );
            }

            // Check inventory with transaction to prevent race conditions
            const available = await checkInventoryByProductIdService(
                item.productId,
                item.productVariantId,
                item.quantity,
                transaction,
            );
            if (!available) {
                throw new AppError(
                    'BadRequest',
                    400,
                    `Insufficient stock for ${(product as any).name}`,
                );
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

        // Handle customer and shipping address for both logged-in and guest users
        let finalCustomerId = customerId;
        let finalShippingAddressId = shippingAddressId;
        if (!customerId && guestData) {
            // Guest checkout flow: find or create customer
            // Extract contact information from guestData
            const guestEmail = guestData.contactType === 'email' ? guestData.contact : undefined;
            const guestPhone = guestData.contactType === 'phone' ? guestData.contact : undefined;
            const guestWhatsapp =
                guestData.contactType === 'whatsapp' ? guestData.contact : undefined;

            // Check if customer already exists by email, phone, or whatsapp
            let existingCustomer = null;

            if (guestEmail) {
                existingCustomer = await findCustomerByEmail(guestEmail, transaction);
            }
            if (!existingCustomer && guestPhone) {
                existingCustomer = await findCustomerByPhone(guestPhone, transaction);
            }

            if (existingCustomer) {
                finalCustomerId = existingCustomer?.id || existingCustomer?.dataValues?.id;
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
                    transaction,
                );

                finalShippingAddressId =
                    shippingAddressRecord?.id || shippingAddressRecord?.dataValues?.id;

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
                throw new AppError('ServerError', 500, 'Failed to process shipping address');
            }
        }

        // Validate that we have a shipping address ID after processing
        if (!finalShippingAddressId) {
            throw new AppError('BadRequest', 400, 'Shipping address could not be resolved');
        }

        // Build guest email/phone based on contact type for legacy support
        const guestEmail =
            guestData && guestData.contactType === 'email' ? guestData.contact : undefined;
        const guestPhone =
            guestData && guestData.contactType === 'phone' ? guestData.contact : undefined;

        let promotionInfo;
        if (promotionId) {
            promotionInfo = await findPromotionByIdRecord(promotionId, transaction);
        }

        const isFreeOrder = Math.round(orderData.totalAmount) === 0;
        // Create order with PENDING status only when payment is required
        const initialOrderStatus = isFreeOrder
            ? 'CONFIRMED'
            : isPrepaidPaymentMethod(paymentMethod)
              ? 'PENDING'
              : 'CONFIRMED';
        const initialPaymentStatus = isFreeOrder ? 'COMPLETED' : 'PENDING';
        const paymentMetadata: any = {
            method: paymentMethod,
            provider: isFreeOrder
                ? 'free'
                : isPrepaidPaymentMethod(paymentMethod)
                  ? config.payment.provider
                  : 'cod',
            paymentDetails: paymentDetails || {},
        };

        const metadata: any = { payment: paymentMetadata };
        if (promotionInfo || promotionDetails) {
            metadata.promotion = {
                id: promotionInfo?.id || promotionDetails?.id,
                title: promotionInfo?.title || promotionDetails?.title,
                type: promotionInfo?.type || promotionDetails?.type,
                discountAmount: promotionDetails?.discount ?? null,
            };
            metadata.appliedAt = new Date().toISOString();
        }

        if (orderData.couponId || orderData.couponCode) {
            metadata.coupon = {
                id: orderData.couponId,
                code: orderData.couponCode,
                type: orderData.couponType,
                discountAmount: orderData.couponDiscount ?? 0,
            };
            metadata.couponAppliedAt = new Date().toISOString();
            metadata.appliedAt = metadata.appliedAt || new Date().toISOString();
        }

        // Create order WITHOUT orderNumber first (to avoid race conditions)
        const order = await createOrder(
            {
                customerId: finalCustomerId,
                guestEmail,
                guestPhone,
                shippingAddressId: finalShippingAddressId,
                paymentMethod,
                status: initialOrderStatus,
                paymentStatus: initialPaymentStatus,
                subtotal: parseFloat(subtotal.toFixed(2)),
                taxAmount: parseFloat(taxAmount.toFixed(2)),
                discountAmount: totalDiscount,
                totalAmount: Math.round(orderData.totalAmount),
                finalAmount,
                shippingCost: parseFloat(shippingCost.toFixed(2)),
                metadata,
            },
            transaction,
        );

        const orderId = order?.dataValues?.id ?? (order as any).id;

        // Now generate unique orderNumber using the order ID
        // const orderNumber = await generateOrderNumber();

        // Create Razorpay order only for prepaid payments (using orderNumber as receipt)
        // IMPORTANT: Razorpay expects amount in paise (multiply rupees by 100)
        const paymentSession =
            isPrepaidPaymentMethod(paymentMethod) && !isFreeOrder
                ? await createPaymentGatewayOrder(
                      paymentMethod,
                      Math.round(orderData?.totalAmount * 100),
                      (order as any).orderNumber,
                  )
                : undefined;

        if (orderData.couponId && (isFreeOrder || paymentMethod === 'cod')) {
            await recordCouponUsage(
                orderData.couponId,
                finalCustomerId!,
                orderId,
                orderData.couponCode || '',
                Number(orderData.couponDiscount || 0),
                Number(orderData.totalAmount),
                transaction,
            );
        }

        // Update order with generated orderNumber and gateway order ID
        await updateOrder(
            orderId,
            {
                orderNumber: (order as any).orderNumber,
                metadata: {
                    ...metadata,
                    payment: {
                        ...paymentMetadata,
                        gatewayOrderId: paymentSession?.gatewayOrderId,
                        publicKey: paymentSession?.publicKey,
                    },
                },
            },
            transaction,
        );

        // Create order items and reserve stock within transaction
        for (const itemData of orderItems) {
            await createOrderItem(
                {
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
                },
                transaction,
            );

            // Reserve stock within transaction
            if (paymentMethod !== 'online') {
                await reserveStockByProductIdService(
                    itemData.productId,
                    itemData?.productVariantId,
                    itemData.quantity,
                    transaction,
                );
            }
        }

        return {
            id: orderId,
            orderNumber: (order as any).orderNumber,
            customerId: finalCustomerId,
            status: initialOrderStatus,
            paymentMethod,
            finalAmount,
            paymentSession,
            message: isPrepaidPaymentMethod(paymentMethod)
                ? 'Order created successfully. Complete payment using the secure checkout session.'
                : 'Order placed successfully. Awaiting payment confirmation.',
        };
    });
};

export const confirmPaymentService = async (orderId: string) => {
    const result: any = await withTransaction(async (transaction) => {
        const order = await findOrderById(orderId, transaction);
        if (!order) {
            throw new AppError('NotFound', 404, 'Order not found');
        }

        if (
            (order as any)?.paymentStatus === 'COMPLETED' ||
            order?.dataValues?.paymentStatus === 'COMPLETED'
        ) {
            return {
                id: (order as any)?.id || order?.dataValues?.id,
                status: (order as any).status || order?.dataValues?.status,
                message: 'Payment already confirmed',
            };
        }

        if (
            (order as any).paymentStatus !== 'PENDING' ||
            order?.dataValues?.paymentStatus !== 'PENDING'
        ) {
            throw new AppError(
                'BadRequest',
                400,
                'Payment already processed or invalid payment state',
            );
        }

        // Update order status from PENDING to CONFIRMED when payment is confirmed
        await updateOrder(
            orderId,
            {
                status: 'CONFIRMED',
                paymentStatus: 'COMPLETED',
            },
            transaction,
        );

        const items = await findOrderItems(orderId);
        for (let item of items) {
            let orderItem = item.get({ plain: true });
            await updateOrderItem(
                (orderItem as any).id,
                {
                    status: 'CONFIRMED',
                },
                transaction,
            );

            await reserveStockByProductIdService(
                orderItem?.productId,
                orderItem?.productVariantId,
                orderItem?.quantity,
                transaction,
            );
            // await confirmOrderService((orderItem as any).productId, orderItem?.productVariantId, (orderItem as any).quantity, transaction);
        }

        const couponMetadata =
            (order as any)?.metadata?.coupon || order?.dataValues?.metadata?.coupon;
        if (couponMetadata?.id) {
            await recordCouponUsage(
                couponMetadata.id,
                (order as any)?.customerId || order?.dataValues?.customerId,
                orderId,
                couponMetadata.code || '',
                Number(couponMetadata.discountAmount || 0),
                Number((order as any)?.totalAmount || order?.dataValues?.totalAmount),
                transaction,
            );
        }

        logger.info('Payment confirmed', { orderId });
        return {
            id: (order as any)?.id || order?.dataValues?.id,
            status: 'CONFIRMED',
            orderNumber: (order as any).orderNumber || order?.dataValues?.orderNumber,
            finalAmount: (order as any).finalAmount || order?.dataValues?.finalAmount,
            customerId: (order as any).customerId || order?.dataValues?.customerId,
            message: 'Payment confirmed. Order forwarded to sellers.',
        };
    });

    // Send emails after transaction commit
    const customer = await findCustomerById(result?.customerId);

    try {
        await sendNewOrderNotificationEmail(
            result?.orderNumber || result?.dataValues?.orderNumber,
            customer?.email || 'Guest',
            result?.finalAmount || result?.dataValues?.finalAmount,
            'support',
        );

        logger.info('Sales team notification sent for confirmed payment', {
            orderId: result.id,
            orderNumber: result.orderNumber,
        });
    } catch (error) {
        logger.error('Failed to send sales team notification for confirmed payment', {
            error,
            orderId: result.id,
        });
    }

    // Send confirmation to customer
    if (customer?.email) {
        try {
            await sendOrderConfirmationEmail(
                customer.email,
                result?.orderNumber || result?.dataValues?.orderNumber,
                result?.finalAmount || result?.dataValues?.finalAmount,
                'sales',
            );
            logger.info('Customer confirmation email sent for confirmed payment', {
                orderId: result.id || result?.dataValues?.id,
                customerEmail: customer?.email,
            });
        } catch (error) {
            logger.error('Failed to send customer confirmation for confirmed payment', {
                error,
                orderId: result.id,
                customerEmail: customer.email,
            });
        }
    }

    return result;
};

export const getCustomerOrdersService = async (
    customerId: string,
    filters: any,
    customerEmail?: string,
) => {
    return await findCustomerOrders(customerId, filters, customerEmail);
};

export const getCustomerOrderService = async (
    customerId: string,
    orderId: string,
    customerEmail?: string,
) => {
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
                await releaseStockService(
                    (item as any).productId,
                    item?.productVariantId,
                    (item as any).quantity,
                    transaction,
                );
            }
            await updateOrderItem(
                (item as any).id,
                {
                    status: 'CANCELLED',
                },
                transaction,
            );
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
    updateData?: any,
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
            throw new AppError(
                'BadRequest',
                400,
                `Cannot transition from ${(item as any).status} to ${newStatus}`,
            );
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
