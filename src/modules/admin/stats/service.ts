/**
 * Admin Statistics Service
 * Real database implementation for platform analytics and metrics
 */

import { sequelize } from '../../../db/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { User } from '../../../models';
import { Seller, SellerStatus } from '../../sellers/model';
import Order from '../../admin/orders/order.model';
import Product from '../../admin/products/product.model';
import { PlatformStats, ChartDataPoint, StatsQueryParams } from './types';
import logger from '../../../utils/logger';
import { AppError } from '../../../utils/AppError';

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
const generateTrendDataFromDB = async (
  model: any,
  days: number = 30,
  dateField: string = 'createdAt'
): Promise<ChartDataPoint[]> => {
  const data: ChartDataPoint[] = [];
  const today = new Date();

  // Set up date calculations
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  try {
    const results = await model.findAll({
      attributes: [
        [fn('DATE', col(dateField)), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        [dateField]: {
          [Op.between]: [startDate, today],
        },
      },
      group: [fn('DATE', col(dateField))],
      order: [[fn('DATE', col(dateField)), 'ASC']],
      raw: true,
      subQuery: false,
    });

    // Fill in data for all days, even if no records
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const record = results.find((r: any) => r.date === dateStr);

      data.push({
        date: dateStr,
        value: record ? parseInt(record.count, 10) : 0,
      });
    }

    return data;
  } catch (error: any) {
    logger.warn('Error generating trend data', { error, model: model.name });
    // Return zero-filled array as fallback
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        value: 0,
      });
    }
    return data;
  }
};

/**
 * Get platform statistics with real database aggregations
 */
export const getPlatformStats = async (params?: StatsQueryParams): Promise<PlatformStats> => {
  try {
    // Get date ranges
    const period = params?.period || 'month';
    const { start: monthStart, end: monthEnd } = getDateRange(period);

    // === TOTAL COUNTS ===
    const [
      totalUsersResult,
      totalSellersResult,
      totalOrdersResult,
      activeProductsResult,
    ] = await Promise.all([
      User.findOne({
        attributes: [[fn('COUNT', col('*')), 'count']],
        raw: true,
      }) as any,
      Seller.findOne({
        attributes: [[fn('COUNT', col('*')), 'count']],
        where: { status: SellerStatus.APPROVED },
        raw: true,
      }) as any,
      Order.findOne({
        attributes: [[fn('COUNT', col('*')), 'count']],
        raw: true,
      }) as any,
      Product.findOne({
        attributes: [[fn('COUNT', col('*')), 'count']],
        where: { status: 'ACTIVE' },
        raw: true,
      }) as any,
    ]);

    const totalUsers = totalUsersResult?.count ? parseInt(totalUsersResult.count, 10) : 0;
    const totalSellers = totalSellersResult?.count ? parseInt(totalSellersResult.count, 10) : 0;
    const totalOrders = totalOrdersResult?.count ? parseInt(totalOrdersResult.count, 10) : 0;
    const activeProducts = activeProductsResult?.count ? parseInt(activeProductsResult.count, 10) : 0;

    // === REVENUE CALCULATIONS ===
    const [
      totalRevenueResult,
      monthlyRevenueResult,
      monthlyOrdersResult,
    ] = await Promise.all([
      Order.findOne({
        attributes: [
          [fn('SUM', col('final_amount')), 'total'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: {
          paymentStatus: 'COMPLETED',
        },
        raw: true,
      }) as any,
      Order.findOne({
        attributes: [[fn('SUM', col('final_amount')), 'total']],
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: {
            [Op.between]: [monthStart, monthEnd],
          },
        },
        raw: true,
      }) as any,
      Order.findOne({
        attributes: [[fn('COUNT', col('id')), 'count']],
        where: {
          createdAt: {
            [Op.between]: [monthStart, monthEnd],
          },
        },
        raw: true,
      }) as any,
    ]);

    const totalRevenue = totalRevenueResult?.total ? parseFloat(totalRevenueResult.total) : 0;
    const mensualRevenue = monthlyRevenueResult?.total
      ? parseFloat(monthlyRevenueResult.total)
      : 0;
    const mensualOrders = monthlyOrdersResult?.count ? parseInt(monthlyOrdersResult.count, 10) : 0;

    // === TREND DATA ===
    const [userGrowthTrend, orderTrend] = await Promise.all([
      generateTrendDataFromDB(User, 30, 'createdAt'),
      generateTrendDataFromDB(Order, 30, 'createdAt'),
    ]);

    return {
      totalUsers,
      totalSellers,
      totalOrders,
      totalRevenue,
      activeProducts,
      mensualRevenue,
      mensualOrders,
      userGrowthTrend,
      orderTrend,
    };
  } catch (error: any) {
    logger.error('Error calculating platform statistics', { error });
    throw new AppError('StatsError', 500, error.message || 'Failed to calculate platform statistics');
  }
};
