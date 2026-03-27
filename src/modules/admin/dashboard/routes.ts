/**
 * Admin Dashboard Routes
 * API endpoints for dashboard data
 */

import { Router } from 'express';
import {
  getDashboardHandler,
  getDashboardSummaryHandler,
  getDashboardTrendsHandler,
} from './controller';
import { requirePermission } from '../middleware';

const dashboardRouter = Router();

/**
 * GET /admin/dashboard
 * Get complete dashboard data with statistics and trends
 * Required permission: admin.dashboard.read
 */
dashboardRouter.get(
  '/',
  requirePermission('admin.dashboard.read'),
  getDashboardHandler
);

/**
 * GET /admin/dashboard/summary
 * Get key metrics summary only
 * Required permission: admin.dashboard.read
 */
dashboardRouter.get(
  '/summary',
  requirePermission('admin.dashboard.read'),
  getDashboardSummaryHandler
);

/**
 * GET /admin/dashboard/trends
 * Get trend data for charts
 * Required permission: admin.dashboard.read
 */
dashboardRouter.get(
  '/trends',
  requirePermission('admin.dashboard.read'),
  getDashboardTrendsHandler
);

export default dashboardRouter;
