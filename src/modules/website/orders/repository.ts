import { Order } from '../../admin/orders/order.model';
import { OrderItem } from '../../admin/orders/order-item.model';
import { AppError } from '../../../utils/AppError';
import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import { Promotion } from '../../admin/website/models';
import { Customer } from '../guests/customer.model';

export const createOrder = async (data: any, transaction: Transaction) => {
    try {
        const order = await Order.create(data, { transaction });
        return order;
    } catch (error) {
        throw error;
    }
};

export const findOrderById = async (id: string, transaction?: Transaction) => {
    const options = transaction ? { transaction } : {};
    return await Order.findByPk(id, options);
};

export const findPromotionByIdRecord = async (promotionId: string, transaction?: Transaction) => {
    return await Promotion.findByPk(promotionId, {
        raw: true,
        transaction,
    });
};

export const findCustomerByIdRecord = async (customerId: string, transaction?: Transaction) => {
    return await Customer.findByPk(customerId, {
        raw: true,
        transaction,
    });
};

export const findOrderByNumber = async (orderNumber: string) => {
    return await Order.findOne({ where: { orderNumber } });
};

export const findOrderByGatewayOrderId = async (gatewayOrderId: string) => {
    return await Order.findOne({
        where: sequelize.where(
            sequelize.json('metadata.payment.gatewayOrderId') as any,
            gatewayOrderId,
        ),
    });
};

export const findCustomerOrders = async (
    customerId: string,
    filters: any = {},
    customerEmail?: string,
) => {
    const { limit = 20, offset = 0, status } = filters;

    // We use the raw SQL approach to handle the complex OR logic and subqueries efficiently
    const sql = `
    SELECT 
      o.id,
      o.order_number AS "orderNumber",
      o.delivered_at AS "deliveryDate",
      o.delivery_date AS "scheduledDeliveryDate",
      o.discount_amount AS "discountAmount",
      o.final_amount AS "finalAmount",
      o.payment_method AS "paymentMethod",
      o.payment_status AS "paymentStatus",
      o.tracking_number AS "trackingNumber",
      o.status AS "status",
      o.total_amount AS "totalAmount",
      o.shipping_cost AS "shippingCost",
      o.tax_amount AS "taxAmount",
      o.created_at AS "createdAt",
      -- Window function to get total count regardless of LIMIT/OFFSET
      COUNT(*) OVER()::int AS "totalCount", 
      (
        SELECT COUNT(*)::int 
        FROM "order_items" AS items
        WHERE items."order_id" = o.id
      ) AS "itemsCount"
    FROM orders o
    WHERE (
      o.customer_id = :customerId 
      OR (o.guest_email = :customerEmail AND :customerEmail IS NOT NULL)
    )
    ${status ? 'AND o.status = :status' : ''}
    ORDER BY o.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

    const orders: any[] = await sequelize.query(sql, {
        replacements: {
            customerId,
            customerEmail: customerEmail || null,
            status: status || null,
            limit,
            offset,
        },
        type: QueryTypes.SELECT,
    });

    return {
        orders,
        limit,
        offset,
        total: orders.length > 0 ? orders[0].totalCount : 0,
    };
};

export const findCustomerOrder = async (
    customerId: string,
    orderId: string,
    customerEmail?: string,
) => {
    // return await Order.findOne({
    //   where: { id: orderId, customerId },
    //   include: [{ model: OrderItem, as: 'items', attributes: { exclude: ['createdAt', 'updatedAt'] } }],
    // });

    const query = `
    SELECT 
      o.id,
      o.order_number AS "orderNumber",
      o.delivered_at AS "deliveryDate",
      o.delivery_date AS "scheduledDeliveryDate",
      o.discount_amount AS "discountAmount",
      o.final_amount AS "finalAmount",
      o.payment_method AS "paymentMethod",
      o.payment_status AS "paymentStatus",
      o.status    AS "status",
      o.total_amount AS "totalAmount",
      o.shipping_cost AS "shippingCost",
      o.tax_amount AS "taxAmount",
      o.shipping_address_id AS "shippingAddressId",
      o.metadata AS "metadata",
      o.created_at AS "createdAt",
      o.tracking_number AS "trackingNumber",
      (SELECT COUNT(*) FROM order_items AS items WHERE items.order_id = o.id) AS "itemsCount",
      sa.type AS "shippingAddressType",
      sa.address_line1 AS "shippingAddressLine1",
      sa.address_line2 AS "shippingAddressLine2",
      sa.city AS "shippingCity",
      sa.state AS "shippingState",
      sa.postal_code AS "shippingPostalCode",
      sa.country AS "shippingCountry",
      sa.phone AS "shippingPhone",
      (SELECT json_agg(json_build_object(
        'id', oi.id,
        'productId', oi.product_id,
        'productName', p.name,
        'productImage', (p.images->>0),
        'productVariantId', oi.product_variant_id,
        -- Concatenate weight and unit with a space in between
        'weight', (pv.weight::TEXT || ' ' || pv.weight_unit::TEXT),
        'sku', oi.sku,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'discountedPrice', oi.discounted_price,
        'discountedPercent', oi.discounted_percent,
        'subtotal', oi.subtotal,
        'taxAmount', oi.tax_amount,
        'itemTotal', oi.item_total,
        'status', oi.status
      )) FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
      WHERE oi.order_id = o.id) AS items
    FROM orders o
    LEFT JOIN "addresses" sa ON o.shipping_address_id = sa.id
    WHERE o.id = :orderId AND (o.customer_id = :customerId OR (o.guest_email = :customerEmail AND :customerEmail IS NOT NULL))
    LIMIT 1
  `;

    const orders = await sequelize.query(query, {
        replacements: { orderId, customerId, customerEmail: customerEmail || null },
        type: QueryTypes.SELECT,
        logging(sql, timing) {
            console.log('Executed SQL:', sql);
            if (timing) {
                console.log('Execution time:', timing, 'ms');
            }
        },
        benchmark: true,
    });
    return orders[0];
};

export const updateOrder = async (id: string, data: any, transaction?: Transaction) => {
    const order = await findOrderById(id, transaction);
    if (!order) throw new AppError('NotFound', 404, 'Order not found');
    return await order.update(data, transaction ? { transaction } : {});
};

export const updateOrderStatus = async (id: string, status: string, transaction?: Transaction) => {
    const order = await findOrderById(id, transaction);
    if (!order) throw new AppError('NotFound', 404, 'Order not found');
    return await order.update({ status: status as any }, transaction ? { transaction } : {});
};

export const updateOrderItemStatus = async (
    id: string,
    status: string,
    transaction?: Transaction,
) => {
    const orderItem = await findOrderItemById(id);
    if (!orderItem) throw new AppError('NotFound', 404, 'Order item not found');
    return await orderItem.update({ status: status as any }, transaction ? { transaction } : {});
};

export const createOrderItem = async (data: any, transaction: Transaction) => {
    return await OrderItem.create(data, { transaction });
};

export const findOrderItemById = async (id: string, transaction?: Transaction) => {
    return await OrderItem.findByPk(id, transaction ? { transaction } : {});
};

export const findOrderItems = async (orderId: string) => {
    return await OrderItem.findAll({ where: { orderId } });
};

export const updateOrderItem = async (id: string, data: any, transaction?: Transaction) => {
    const item = await OrderItem.findByPk(id, transaction ? { transaction } : {});
    if (!item) throw new AppError('NotFound', 404, 'Order item not found');
    return await item.update(data, transaction ? { transaction } : {});
};

export const getSellerOrderItems = async (sellerId: string, filters: any = {}) => {
    const { limit = 20, offset = 0, status } = filters;
    const where: any = { sellerId };
    if (status) where.status = status;

    return await OrderItem.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
};

export const generateOrderNumber = async () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');
    return `ORD${dateStr}${random}`;
};
