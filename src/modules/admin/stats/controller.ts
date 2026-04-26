/**
 * Admin Statistics Controller
 * Handles HTTP requests for platform statistics and analytics
 */

import { NextFunction, Response } from 'express';
import { getPlatformStats } from './service';
import { AuthenticatedRequest } from '../middleware';
import logger from '../../../utils/logger';

/**
 * GET /admin/stats
 * Get platform statistics
 */
export const getStatsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    logger.error('Get stats error', { error });
    next(error);
  }
};
