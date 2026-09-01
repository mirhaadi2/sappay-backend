/**
 * Admin Statistics Service
 * Real database implementation for platform analytics and metrics
 */

import { User } from '../../admin/customers/models';
import { Order } from '../orders/order.model';
import { PlatformStats, StatsQueryParams } from './types';
import logger from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';
import {
    getTotalUsersCount,
    getApprovedSellerCount,
    getTotalOrderCount,
    getActiveProductCount,
    getRevenueSummary,
    generateTrendDataFromDB,
} from './repository';

/**
 * Get date range for monthly/yearly statistics
 */
const getDateRange = (period: string = 'month'): { start: Date; end: Date } => {
    const now = new Date();
    const start = new Date();

    switch (period) {
        case 'day':
            start.setDate(now.getDate() - 1);
            break;
        case 'week':
            start.setDate(now.getDate() - 7);
            break;
        case 'month':
            start.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            start.setFullYear(now.getFullYear() - 1);
            break;
        default:
            start.setMonth(now.getMonth() - 1);
    }

    return { start, end: now };
};

/**
 * Generate trend data with actual database counts
 */
/**
 * Get platform statistics with real database aggregations
 */
export const getPlatformStats = async (params?: StatsQueryParams): Promise<PlatformStats> => {
    try {
        const period = params?.period || 'month';
        const { start: monthStart, end: monthEnd } = getDateRange(period);

        const [
            totalUsersResult,
            totalSellersResult,
            totalOrdersResult,
            activeProductsResult,
            revenueSummary,
        ] = await Promise.all([
            getTotalUsersCount(),
            getApprovedSellerCount(),
            getTotalOrderCount(),
            getActiveProductCount(),
            getRevenueSummary(monthStart, monthEnd),
        ]);

        const totalUsers = totalUsersResult?.count
            ? parseInt(String(totalUsersResult.count), 10)
            : 0;
        const totalSellers = totalSellersResult?.count
            ? parseInt(String(totalSellersResult.count), 10)
            : 0;
        const totalOrders = totalOrdersResult?.count
            ? parseInt(String(totalOrdersResult.count), 10)
            : 0;
        const activeProducts = activeProductsResult?.count
            ? parseInt(String(activeProductsResult.count), 10)
            : 0;

        const [userGrowthTrend, orderTrend] = await Promise.all([
            generateTrendDataFromDB(User, 30, 'createdAt'),
            generateTrendDataFromDB(Order, 30, 'createdAt'),
        ]);

        return {
            totalUsers,
            totalSellers,
            totalOrders,
            totalRevenue: revenueSummary.totalRevenue,
            activeProducts,
            mensualRevenue: revenueSummary.monthlyRevenue,
            mensualOrders: revenueSummary.monthlyOrders,
            userGrowthTrend,
            orderTrend,
        };
    } catch (error: any) {
        logger.error('Error calculating platform statistics', { error });
        throw new AppError(
            'StatsError',
            500,
            error.message || 'Failed to calculate platform statistics',
        );
    }
};
