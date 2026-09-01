/**
 * Admin Orders Service
 * Real database implementation for order management
 */

import { Product } from '../products/model';
import { AppError } from '../../../utils/AppError';
import { AdminOrderQuery, AdminOrder } from './types';
import { calculatePagination, buildPaginatedResponse } from '../../shared/pagination';
import logger from '../../../utils/logger';
import { sequelize } from '../../../db/sequelize';
import { Transaction } from 'sequelize';
import { cancelOrderService } from '../../sellers/inventory/service';
import { resolveR2Url } from '../products/transformer';
import { decrementStockByProductId } from '../../sellers/inventory';
import {
    listAdminOrders,
    findOrderById,
    findOrderItemsByOrderId,
    findOrderByPk,
    updateOrderRecord,
    updateOrderItemsForOrder,
} from './repository';

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

        const { rows, totalCount } = await listAdminOrders({
            status: query.status,
            search: query.search,
            limit,
            offset,
        });

        return buildPaginatedResponse(rows, totalCount, {
            page,
            limit,
            offset,
        });
    } catch (error: any) {
        logger.error('Error listing admin orders', { error });
        throw new AppError('OrderError', 500, error.message || 'Failed to list orders');
    }
};

/**
 * Get single order with all items and seller information
 */
export const adminGetOrder = async (id: string): Promise<any> => {
    try {
        const results: any = await findOrderById(id);

        if (!results) {
            throw new AppError('NotFoundError', 404, 'Order not found');
        }

        await Promise.all(
            results.items.map(async (item: any) => {
                if (item?.productImages) {
                    try {
                        const imagePromises = Array.isArray(item.productImages)
                            ? item.productImages.map((img: any) => resolveR2Url(img))
                            : [];

                        const resolvedImages = await Promise.all(imagePromises);
                        item.productImage = resolvedImages?.[0] || '/placeholder.png';
                    } catch (err) {
                        logger.warn('Failed to parse product images for order item', {
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
        logger.error('Error fetching admin order details', { orderId: id, error });
        if (error instanceof AppError) throw error;
        throw new AppError('InternalError', 500, 'Failed to fetch order details');
    }
};

const releaseReservedStockForOrder = async (orderId: string, transaction: Transaction) => {
    const orderItems = await findOrderItemsByOrderId(orderId, transaction);
    await Promise.all(
        orderItems.map(async (item: any) => {
            if (!item.sellerProductId) return;
            if (['PENDING', 'CONFIRMED'].includes(item.status)) {
                await cancelOrderService(
                    item.sellerProductId,
                    item?.productVariantId,
                    item.quantity,
                    transaction,
                );
            }
        }),
    );
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
    staffId?: string,
): Promise<AdminOrder> => {
    const transaction = await sequelize.transaction();
    try {
        const order = await findOrderByPk(id);
        if (!order) {
            throw new AppError('NotFoundError', 404, 'Order not found');
        }

        // 1. Comprehensive Status Mapping
        const statusMap: Record<string, string> = {
            pending: 'PENDING',
            confirmed: 'CONFIRMED',
            processing: 'PROCESSING',
            packed: 'PACKED',
            handover: 'HANDOVER', // Critical: The moment responsibility shifts to courier
            shipped: 'SHIPPED',
            out_for_delivery: 'OUT_FOR_DELIVERY',
            delivered: 'DELIVERED',
            delivery_failed: 'DELIVERY_FAILED',
            rto: 'RTO',
            cancelled: 'CANCELLED',
            refunded: 'CANCELLED',
        };

        const newStatus = statusMap[data.status.toLowerCase()] || data.status.toUpperCase();

        // 2. Logic Validation: Prevent Handover/Shipping without Tracking Info
        // This stops "ghost" shipments that can't be tracked later
        const requiresTracking = ['HANDOVER', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(newStatus);
        if (requiresTracking && !data.trackingNumber && !order.trackingNumber) {
            throw new AppError(
                'ValidationError',
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
        if (data.status.toLowerCase() === 'refunded') {
            updateData.paymentStatus = 'REFUNDED';
        }

        // 4. Perform the Update
        const requiresInventoryRelease = ['CANCELLED', 'REFUNDED'].includes(newStatus);
        const itemStatusMap: Record<string, string> = {
            PENDING: 'PENDING',
            CONFIRMED: 'CONFIRMED',
            PROCESSING: 'CONFIRMED',
            PACKED: 'PACKED',
            HANDOVER: 'SHIPPED',
            SHIPPED: 'SHIPPED',
            OUT_FOR_DELIVERY: 'SHIPPED',
            DELIVERED: 'DELIVERED',
            DELIVERY_FAILED: 'DELIVERY_FAILED',
            RTO: 'RETURNED',
            CANCELLED: 'CANCELLED',
        };

        const itemStatus = itemStatusMap[newStatus] || 'PENDING';

        if (requiresInventoryRelease) {
            try {
                await updateOrderRecord(id, updateData, transaction);

                const items = await findOrderItemsByOrderId(id, transaction);
                await Promise.all(
                    items.map(async (item: any) => {
                        if (!item.productId) return;
                        if (['PENDING', 'CONFIRMED'].includes(item.status)) {
                            await cancelOrderService(
                                item.productId,
                                item?.productVariantId,
                                item.quantity,
                                transaction,
                            );
                        }
                    }),
                );

                await updateOrderItemsForOrder(
                    id,
                    {
                        status: itemStatus as any,
                        statusReason: data.statusReason || `Order status updated to ${newStatus}`,
                        statusUpdatedAt: new Date(),
                        statusUpdatedBy: staffId || 'ADMIN',
                    },
                    transaction,
                );
            } catch (error) {
                // await transaction.rollback();
                throw error;
            }
        } else {
            await updateOrderRecord(id, updateData, transaction);
            await updateOrderItemsForOrder(
                id,
                {
                    status: itemStatus as any,
                    statusReason: data.statusReason || `Order status updated to ${newStatus}`,
                    statusUpdatedAt: new Date(),
                    statusUpdatedBy: staffId || 'ADMIN',
                },
                transaction,
            );

            const items = await findOrderItemsByOrderId(id, transaction);
            await Promise.all(
                items.map(async (item: any) => {
                    if (!item.productId) return;
                    if (newStatus === 'HANDOVER') {
                        await decrementStockByProductId(
                            item.productId,
                            item.productVariantId,
                            item.quantity,
                            transaction,
                        );
                    }
                }),
            );
        }

        logger.info('Order status updated by admin', {
            orderId: id,
            newStatus,
            itemStatus,
            hasTracking: !!(data.trackingNumber || order.trackingNumber),
            reason: data.statusReason,
        });

        // 6. Return fresh data
        await transaction.commit();
        return adminGetOrder(id);
    } catch (error: any) {
        await transaction.rollback();
        logger.error('Error updating admin order status', { orderId: id, error });

        // Maintain existing error structure
        if (error instanceof AppError) throw error;
        throw new AppError('InternalError', 500, error.message || 'Failed to update order');
    }
};

/**
 * Refund order and update payment status
 */
export const adminRefundOrder = async (id: string, reason?: string): Promise<AdminOrder> => {
    try {
        const order = await findOrderByPk(id);

        if (!order) {
            throw new AppError('NotFoundError', 404, 'Order not found');
        }

        // Update payment status to refunded
        const metadata = order.metadata || {};
        metadata.refundReason = reason || 'Admin initiated refund';
        metadata.refundedAt = new Date().toISOString();

        const transaction = await sequelize.transaction();
        try {
            await updateOrderRecord(
                id,
                {
                    paymentStatus: 'REFUNDED',
                    status: 'CANCELLED',
                    metadata,
                },
                transaction,
            );

            await releaseReservedStockForOrder(id, transaction);

            await updateOrderItemsForOrder(id, { status: 'CANCELLED' }, transaction);

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        logger.info('Order refunded by admin', { orderId: id, reason, itemsUpdated: true });
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
        const order = await findOrderByPk(id);

        if (!order) {
            throw new AppError('NotFoundError', 404, 'Order not found');
        }

        const metadata = order.metadata || {};
        metadata.cancellationReason = reason || 'Admin cancelled';
        metadata.cancelledAt = new Date().toISOString();

        const transaction = await sequelize.transaction();
        try {
            await updateOrderRecord(
                id,
                {
                    status: 'CANCELLED',
                    metadata,
                },
                transaction,
            );

            await releaseReservedStockForOrder(id, transaction);

            await updateOrderItemsForOrder(id, { status: 'CANCELLED' }, transaction);

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        logger.info('Order cancelled by admin', { orderId: id, reason, itemsUpdated: true });
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
        const order = await findOrderByPk(id);

        if (!order) {
            throw new AppError('NotFoundError', 404, 'Order not found');
        }

        const metadata = order.metadata || {};
        metadata.disputeStatus = 'RESOLVED';
        metadata.disputeResolution = resolution || 'Resolved by admin';
        metadata.resolvedAt = new Date().toISOString();

        await updateOrderRecord(id, { metadata });

        logger.info('Order dispute resolved by admin', { orderId: id, resolution });
        return adminGetOrder(id);
    } catch (error: any) {
        logger.error('Error resolving admin order dispute', { orderId: id, error });
        if (error instanceof AppError) throw error;
        throw new AppError('NotFoundError', 404, 'Order not found');
    }
};
