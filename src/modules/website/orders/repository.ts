import { default as Order } from '../../admin/orders/order.model';
import { OrderItem } from '../../admin/orders/order-item.model';
import { AppError } from '../../../utils/AppError';
import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../../../db/sequelize';

export const createOrder = async (data: any, transaction: Transaction) => {
  try {
    const order = await Order.create(data, { transaction });
    return order;
  } catch (error) {
    throw error;
  }
};

export const findOrderById = async (id: string) => {
  return await Order.findByPk(id);
};

export const findOrderByNumber = async (orderNumber: string) => {
  return await Order.findOne({ where: { orderNumber } });
};

export const findCustomerOrders = async (customerId: string, filters: any = {}, customerEmail?: string) => {
  const { limit = 20, offset = 0, status } = filters;
  const { Op } = require('sequelize');
  
  // Build where clause for both authenticated orders and guest orders
  const where: any = {
    [Op.or]: [
      { customerId }, // Orders placed by authenticated user
      customerEmail ? { guestEmail: customerEmail } : null, // Guest orders with matching email
    ].filter(Boolean),
  };
  
  if (status) where.status = status;

  return await Order.findAll({
    attributes: {
      include: [
        [
          sequelize.literal(`(
          SELECT COUNT(*)
          FROM "order_items" AS items
          WHERE items."order_id" = "Order".id
        )`),
          'itemsCount'
        ]
      ]
    },
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
};

export const findCustomerOrder = async (customerId: string, orderId: string, customerEmail?: string) => {
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
        'subtotal', oi.subtotal,
        'taxAmount', oi.tax_amount,
        'itemTotal', oi.item_total,
        -- 'discountedPrice', oi.discounted_price,
        -- 'discountedPercent', oi.discounted_percent,
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
    benchmark: true
  });
  return orders[0];
};

export const updateOrder = async (id: string, data: any, transaction?: Transaction) => {
  const order = await findOrderById(id);
  if (!order) throw new AppError('NotFound', 404, 'Order not found');
  return await order.update(data, transaction ? { transaction } : {});
};

export const updateOrderStatus = async (id: string, status: string, transaction?: Transaction) => {
  const order = await findOrderById(id);
  if (!order) throw new AppError('NotFound', 404, 'Order not found');
  return await order.update({ status: status as any }, transaction ? { transaction } : {});
};

export const createOrderItem = async (data: any, transaction: Transaction) => {
  return await OrderItem.create(data, { transaction });
};

export const findOrderItems = async (orderId: string) => {
  return await OrderItem.findAll({ where: { orderId } });
};

export const updateOrderItem = async (id: string, data: any, transaction?: Transaction) => {
  const item = await OrderItem.findByPk(id);
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
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ORD${dateStr}${random}`;
};
