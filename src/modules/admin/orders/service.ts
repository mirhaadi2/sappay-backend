/**
 * Admin Orders Service
 * Real database implementation for order management
 */

import { Op, QueryTypes } from "sequelize";
import Order from "../../admin/orders/order.model";
import { OrderItem } from "../../admin/orders/order-item.model";
import { User } from "../../../models";
import { Seller } from "../../sellers/model";
import SellerProduct from "../../admin/products/seller-product/model";
import Product from "../products/model";
import { AppError } from "../../../utils/AppError";
import { AdminOrderQuery, AdminOrder } from "./types";
import {
  calculatePagination,
  buildPaginatedResponse,
} from "../../shared/pagination";
import logger from "../../../utils/logger";
import { sequelize } from "../../../db/sequelize";
import { resolveR2Url } from "../products/transformer";

/**
 * List all orders with customer and seller information
 * Supports filtering by status, seller, customer, and search
 */
export const adminListOrders = async (query: AdminOrderQuery) => {
  try {
    const { page, limit, offset } = calculatePagination(
      { page: query.page, limit: query.limit },
      100,
    );

    // 1. Build Dynamic Where Clause for Raw SQL
    let whereClause = "WHERE 1=1";
    const replacements: any = { limit, offset };

    if (query.status) {
      whereClause += " AND o.status = :status";
      replacements.status = query.status.toUpperCase();
    }

    if (query.search) {
      whereClause +=
        " AND (o.order_number ILIKE :search OR c.name ILIKE :search OR c.email ILIKE :search)";
      replacements.search = `%${query.search}%`;
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
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN addresses address ON o.shipping_address_id = address.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const orders: any[] = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
      logging: (sql, timing) =>
        logger.info("Admin Order Search", { sql, timing }),
      benchmark: true,
    });

    // 3. Extract count from the first row (Postgres returns count as string)
    const totalCount = orders.length > 0 ? parseInt(orders[0].total_count) : 0;

    // Optional: Clean up the total_count property from rows if you want a clean object
    const sanitizedOrders = orders.map(({ total_count, ...order }) => order);

    return buildPaginatedResponse(sanitizedOrders, totalCount, {
      page,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error("Error listing admin orders", { error });
    throw new AppError(
      "OrderError",
      500,
      error.message || "Failed to list orders",
    );
  }
};

/**
 * Get single order with all items and seller information
 */
export const adminGetOrder = async (id: string): Promise<any> => {
  try {
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
        o.created_at AS "createdAt",
        o.updated_at AS "updatedAt",
        
        -- Customer Details
        c.name AS "customerName",
        c.email AS "customerEmail",
        c.phone AS "customerPhone",

        -- Shipping Address Details
        sa.address_line1 AS "shippingAddressLine1",
        sa.address_line2 AS "shippingAddressLine2",
        sa.city AS "shippingCity",
        sa.state AS "shippingState",
        sa.postal_code AS "shippingPostalCode",
        sa.country AS "shippingCountry",
        sa.phone AS "shippingAddressPhone",

        -- Nested Order Items with Product/Variant details
        (
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', p.name,
            'productImages', p.images, -- Assuming you have this for the UI
            'variantId', oi.product_variant_id,
            'sku', oi.sku,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
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
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
      WHERE o.id = :id
      LIMIT 1
    `;

    const results: any = await sequelize.query(sql, {
      replacements: { id },
      type: QueryTypes.SELECT,
      plain: true,
    });

    if (!results) {
      throw new AppError("NotFoundError", 404, "Order not found");
    }

    await Promise.all(
      results.items.map(async (item: any) => {
        if (item?.productImages) {
          try {
            const imagePromises = Array.isArray(item.productImages)
              ? item.productImages.map((img: any) => resolveR2Url(img))
              : [];

            const resolvedImages = await Promise.all(imagePromises);
            item.productImage = resolvedImages?.[0] || "/placeholder.png";
          } catch (err) {
            logger.warn("Failed to parse product images for order item", {
              itemId: item.id,
              error: err,
            });
            item.productImage = [];
          }
        }
      }),
    );

    // Transform status to lowercase for frontend consistency if needed
    return {
      ...results,
    };
  } catch (error: any) {
    logger.error("Error fetching admin order details", { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError("InternalError", 500, "Failed to fetch order details");
  }
};

/**
 * Update order status
 */
export const adminUpdateOrderStatus = async (
  id: string,
  data: {
    status: string;
    trackingNumber?: string;
    statusReason?: string;
  },
): Promise<AdminOrder> => {
  try {
    console.log("Admin updating order status", { id, data });

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError("NotFoundError", 404, "Order not found");
    }

    // 1. Comprehensive Status Mapping
    const statusMap: Record<string, string> = {
      pending: "PENDING",
      confirmed: "CONFIRMED",
      processing: "PROCESSING",
      packed: "PACKED",
      handover: "HANDOVER", // Critical: The moment responsibility shifts to courier
      shipped: "SHIPPED",
      out_for_delivery: "OUT_FOR_DELIVERY",
      delivered: "DELIVERED",
      delivery_failed: "DELIVERY_FAILED",
      rto: "RTO",
      cancelled: "CANCELLED",
      refunded: "CANCELLED",
    };

    const newStatus =
      statusMap[data.status.toLowerCase()] || data.status.toUpperCase();

    // 2. Logic Validation: Prevent Handover/Shipping without Tracking Info
    // This stops "ghost" shipments that can't be tracked later
    const requiresTracking = [
      "HANDOVER",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
    ].includes(newStatus);
    if (requiresTracking && !data.trackingNumber && !order.trackingNumber) {
      throw new AppError(
        "ValidationError",
        400,
        `Tracking ID (AWB) is required to move to ${newStatus} status`,
      );
    }

    // 3. Prepare Single Update Object (Optimized for one DB hit)
    const updateData: any = {
      status: newStatus,
    };

    if (data.trackingNumber) {
      updateData.trackingNumber = data.trackingNumber;
    }

    if (data.statusReason) {
      updateData.statusReason = data.statusReason;
    }

    // Handle special payment status transitions
    if (data.status.toLowerCase() === "refunded") {
      updateData.paymentStatus = "REFUNDED";
    }

    // 4. Perform the Update
    await order.update(updateData);

    logger.info("Order status updated by admin", {
      orderId: id,
      newStatus,
      hasTracking: !!(data.trackingNumber || order.trackingNumber),
      reason: data.statusReason,
    });

    // 5. Return fresh data
    return adminGetOrder(id);
  } catch (error: any) {
    logger.error("Error updating admin order status", { orderId: id, error });

    // Maintain existing error structure
    if (error instanceof AppError) throw error;
    throw new AppError(
      "InternalError",
      500,
      error.message || "Failed to update order",
    );
  }
};

/**
 * Refund order and update payment status
 */
export const adminRefundOrder = async (
  id: string,
  reason?: string,
): Promise<AdminOrder> => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError("NotFoundError", 404, "Order not found");
    }

    // Update payment status to refunded
    const metadata = order.metadata || {};
    metadata.refundReason = reason || "Admin initiated refund";
    metadata.refundedAt = new Date().toISOString();

    await order.update({
      paymentStatus: "REFUNDED",
      status: "CANCELLED",
      metadata,
    });

    logger.info("Order refunded by admin", { orderId: id, reason });
    return adminGetOrder(id);
  } catch (error: any) {
    logger.error("Error refunding admin order", { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError("NotFoundError", 404, "Order not found");
  }
};

/**
 * Cancel order
 */
export const adminCancelOrder = async (
  id: string,
  reason?: string,
): Promise<AdminOrder> => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError("NotFoundError", 404, "Order not found");
    }

    const metadata = order.metadata || {};
    metadata.cancellationReason = reason || "Admin cancelled";
    metadata.cancelledAt = new Date().toISOString();

    await order.update({
      status: "CANCELLED",
      metadata,
    });

    logger.info("Order cancelled by admin", { orderId: id, reason });
    return adminGetOrder(id);
  } catch (error: any) {
    logger.error("Error cancelling admin order", { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError("NotFoundError", 404, "Order not found");
  }
};

/**
 * Handle order dispute
 */
export const adminDisputeOrder = async (
  id: string,
  resolution?: string,
): Promise<AdminOrder> => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError("NotFoundError", 404, "Order not found");
    }

    const metadata = order.metadata || {};
    metadata.disputeStatus = "RESOLVED";
    metadata.disputeResolution = resolution || "Resolved by admin";
    metadata.resolvedAt = new Date().toISOString();

    await order.update({ metadata });

    logger.info("Order dispute resolved by admin", { orderId: id, resolution });
    return adminGetOrder(id);
  } catch (error: any) {
    logger.error("Error resolving admin order dispute", { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError("NotFoundError", 404, "Order not found");
  }
};
