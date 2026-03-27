/**
 * Admin Dashboard Controller
 * Handles HTTP requests for dashboard data and analytics
 */

import { Response } from 'express';
import { getPlatformStats } from '../stats/service';
import { AuthenticatedRequest } from '../middleware';
import logger from '../../../utils/logger';

/**
 * GET /admin/dashboard
 * Get complete dashboard statistics with trends
 */
export const getDashboardHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, period } = req.query;

    const stats = await getPlatformStats({
      startDate: startDate as string,
      endDate: endDate as string,
      period: period as 'day' | 'week' | 'month' | 'year',
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Get dashboard error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard data',
    });
  }
};

/**
 * GET /admin/dashboard/summary
 * Get key metrics summary (faster response for quick overview)
 */
export const getDashboardSummaryHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await getPlatformStats({
      period: 'month',
    });

    // Return only key metrics without trend data
    const summary = {
      totalUsers: stats.totalUsers,
      totalSellers: stats.totalSellers,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      activeProducts: stats.activeProducts,
      mensualRevenue: stats.mensualRevenue,
      mensualOrders: stats.mensualOrders,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    logger.error('Get dashboard summary error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard summary',
    });
  }
};

/**
 * GET /admin/dashboard/trends
 * Get trend data for charts only
 */
export const getDashboardTrendsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period } = req.query;

    const stats = await getPlatformStats({
      period: period as 'day' | 'week' | 'month' | 'year',
    });

    const trends = {
      userGrowthTrend: stats.userGrowthTrend,
      orderTrend: stats.orderTrend,
    };

    res.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    logger.error('Get dashboard trends error', { error });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard trends',
    });
  }
};
