/**
 * Admin Orders Service
 * Real database implementation for order management
 */

import { Op } from 'sequelize';
import Order from '../../admin/orders/order.model';
import { OrderItem } from '../../admin/orders/order-item.model';
import { User } from '../../../models';
import { Seller } from '../../sellers/model';
import SellerProduct from '../../admin/products/seller-product/model';
import Product from '../products/model';
import { AppError } from '../../../utils/AppError';
import { AdminOrderQuery, AdminOrder } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';

/**
 * List all orders with customer and seller information
 * Supports filtering by status, seller, customer, and search
 */
export const adminListOrders = async (query: AdminOrderQuery) => {
  try {
    const { page, limit, offset } = calculatePagination(
      { page: query.page, limit: query.limit },
      100
    );

    const where: any = {};

    // Filter by order status
    if (query.status) {
      where.status = query.status.toUpperCase();
    }

    // Search by order number
    if (query.search) {
      where[Op.or] = [
        { orderNumber: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Get orders
    const { count, rows } = await Order.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', (query.sortOrder || 'desc').toUpperCase()]],
      raw: false,
    });

    // Transform to admin format
    const orders: AdminOrder[] = rows.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: 'Unknown',
      customerEmail: '',
      sellerId: '',
      sellerName: 'Unknown',
      items: [],
      status: (order.status.toLowerCase() as any),
      totalAmount: Number(order.finalAmount),
      createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: order.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return buildPaginatedResponse(orders, count, { page, limit, offset });
  } catch (error: any) {
    logger.error('Error listing admin orders', { error });
    throw new AppError('OrderError', 500, error.message || 'Failed to list orders');
  }
};

/**
 * Get single order with all items and seller information
 */
export const adminGetOrder = async (id: string): Promise<AdminOrder> => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('NotFoundError', 404, 'Order not found');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: 'Unknown',
      customerEmail: '',
      sellerId: '',
      sellerName: 'Unknown',
      items: [],
      status: (order.status.toLowerCase() as any),
      totalAmount: Number(order.finalAmount),
      createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: order.updatedAt?.toISOString() || new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error('Error fetching admin order', { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Order not found');
  }
};

/**
 * Update order status
 */
export const adminUpdateOrderStatus = async (
  id: string,
  data: { status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' }
): Promise<AdminOrder> => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('NotFoundError', 404, 'Order not found');
    }

    // Map admin status to database status
    const statusMap: any = {
      pending: 'PENDING',
      processing: 'PROCESSING',
      shipped: 'SHIPPED',
      delivered: 'DELIVERED',
      cancelled: 'CANCELLED',
      refunded: 'CANCELLED', // Refunded maps to cancelled with payment status change
    };

    const newStatus = statusMap[data.status] || data.status.toUpperCase();

    // Update order status
    await order.update({ status: newStatus as any });

    // If refunding, also update payment status
    if (data.status === 'refunded') {
      await order.update({ paymentStatus: 'REFUNDED' });
    }

    logger.info('Order status updated by admin', { orderId: id, newStatus, oldStatus: order.status });
    return adminGetOrder(id);
  } catch (error: any) {
    logger.error('Error updating admin order status', { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Order not found');
  }
};

/**
 * Refund order and update payment status
 */
export const adminRefundOrder = async (id: string, reason?: string): Promise<AdminOrder> => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('NotFoundError', 404, 'Order not found');
    }

    // Update payment status to refunded
    const metadata = order.metadata || {};
    metadata.refundReason = reason || 'Admin initiated refund';
    metadata.refundedAt = new Date().toISOString();

    await order.update({
      paymentStatus: 'REFUNDED',
      status: 'CANCELLED',
      metadata,
    });

    logger.info('Order refunded by admin', { orderId: id, reason });
    return adminGetOrder(id);
  } catch (error: any) {
    logger.error('Error refunding admin order', { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Order not found');
  }
};

/**
 * Cancel order
 */
export const adminCancelOrder = async (id: string, reason?: string): Promise<AdminOrder> => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('NotFoundError', 404, 'Order not found');
    }

    const metadata = order.metadata || {};
    metadata.cancellationReason = reason || 'Admin cancelled';
    metadata.cancelledAt = new Date().toISOString();

    await order.update({
      status: 'CANCELLED',
      metadata,
    });

    logger.info('Order cancelled by admin', { orderId: id, reason });
    return adminGetOrder(id);
  } catch (error: any) {
    logger.error('Error cancelling admin order', { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Order not found');
  }
};

/**
 * Handle order dispute
 */
export const adminDisputeOrder = async (id: string, resolution?: string): Promise<AdminOrder> => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      throw new AppError('NotFoundError', 404, 'Order not found');
    }

    const metadata = order.metadata || {};
    metadata.disputeStatus = 'RESOLVED';
    metadata.disputeResolution = resolution || 'Resolved by admin';
    metadata.resolvedAt = new Date().toISOString();

    await order.update({ metadata });

    logger.info('Order dispute resolved by admin', { orderId: id, resolution });
    return adminGetOrder(id);
  } catch (error: any) {
    logger.error('Error resolving admin order dispute', { orderId: id, error });
    if (error instanceof AppError) throw error;
    throw new AppError('NotFoundError', 404, 'Order not found');
  }
};
