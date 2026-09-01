import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import { Order } from './order.model';
import { OrderItem } from './order-item.model';

export const listAdminOrders = async ({
    status,
    search,
    limit,
    offset,
}: {
    status?: string;
    search?: string;
    limit: number;
    offset: number;
}) => {
    let whereClause = 'WHERE 1=1';
    const replacements: any = { limit, offset };

    if (status) {
        whereClause += ' AND o.status = :status';
        replacements.status = status.toUpperCase();
    }

    if (search) {
        whereClause +=
            ' AND (o.order_number ILIKE :search OR c.name ILIKE :search OR c.email ILIKE :search)';
        replacements.search = `%${search}%`;
    }

    const sql = `
    SELECT
      o.id,
      o.order_number AS "orderNumber",
      o.customer_id AS "customerId",
      o.status,
      o.final_amount AS "finalAmount",
      o.created_at AS "createdAt",
      o.updated_at AS "updatedAt",
      o.total_amount AS "totalAmount",
      o.discount_amount AS "discountAmount",
      o.tax_amount AS "taxAmount",
      o.shipping_cost AS "shippingCost",
      o.payment_status AS "paymentStatus",
      o.delivery_date AS "deliveryDate",
      o.shipping_address_id AS "shippingAddressId",
      c.name AS "customerName",
      c.email AS "customerEmail",
      c.phone AS "customerPhone",
      address.phone AS "customerAddressPhone",
      address.address_line1 AS "customerAddressLine1",
      address.address_line2 AS "customerAddressLine2",
      address.city AS "customerCity",
      address.state AS "customerState",
      address.postal_code AS "customerPostalCode",
      address.country AS "customerCountry",
      COUNT(*) OVER() AS "total_count"
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN addresses address ON o.shipping_address_id = address.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

    const orders: any[] = await sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT,
    });

    const totalCount = orders.length > 0 ? parseInt(orders[0].total_count, 10) : 0;
    const sanitizedOrders = orders.map(({ total_count, ...order }) => order);

    return { rows: sanitizedOrders, totalCount };
};

export const findOrderById = async (id: string) => {
    const sql = `
    SELECT 
      o.id,
      o.order_number AS "orderNumber",
      o.customer_id AS "customerId",
      o.status,
      o.total_amount AS "totalAmount",
      o.discount_amount AS "discountAmount",
      o.tax_amount AS "taxAmount",
      o.shipping_cost AS "shippingCost",
      o.final_amount AS "finalAmount",
      o.payment_status AS "paymentStatus",
      o.payment_method AS "paymentMethod",
      o.delivery_date AS "deliveryDate",
      o.delivered_at AS "deliveredAt",
      o.metadata AS "metadata",
      o.created_at AS "createdAt",
      o.updated_at AS "updatedAt",
      c.name AS "customerName",
      c.email AS "customerEmail",
      c.phone AS "customerPhone",
      sa.address_line1 AS "shippingAddressLine1",
      sa.address_line2 AS "shippingAddressLine2",
      sa.city AS "shippingCity",
      sa.state AS "shippingState",
      sa.postal_code AS "shippingPostalCode",
      sa.country AS "shippingCountry",
      sa.phone AS "shippingAddressPhone",
      (
        SELECT json_agg(json_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'productName', p.name,
          'productImages', p.images,
          'variantId', oi.product_variant_id,
          'sku', oi.sku,
          'quantity', oi.quantity,
          'unitPrice', oi.unit_price,
          'discountedPrice', oi.discounted_price,
          'discountedPercent', oi.discounted_percent,
          'subtotal', oi.subtotal,
          'taxAmount', oi.tax_amount,
          'itemTotal', oi.item_total,
          'status', oi.status,
          'weight', (pv.weight::TEXT || ' ' || pv.weight_unit::TEXT)
        ))
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
        WHERE oi.order_id = o.id
      ) AS items
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
    WHERE o.id = :id
    LIMIT 1
  `;

    return sequelize.query(sql, {
        replacements: { id },
        type: QueryTypes.SELECT,
        plain: true,
    });
};

export const findOrderItemsByOrderId = async (orderId: string, transaction?: Transaction) => {
    return OrderItem.findAll({
        where: { orderId },
        transaction,
    });
};

export const findOrderByPk = async (id: string, transaction?: Transaction) => {
    return Order.findByPk(id, { transaction });
};

export const updateOrderRecord = async (
    id: string,
    updateData: Record<string, any>,
    transaction?: Transaction,
) => {
    const order = await findOrderByPk(id, transaction);
    if (!order) return null;
    await order.update(updateData, { transaction });
    return order;
};

export const updateOrderItemsForOrder = async (
    orderId: string,
    updateData: Record<string, any>,
    transaction?: Transaction,
) => {
    await OrderItem.update(updateData, {
        where: { orderId },
        transaction,
    });
};
