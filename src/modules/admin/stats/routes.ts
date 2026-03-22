/**
 * Admin Statistics Routes
 * API endpoints for platform statistics
 */

import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import { getStatsHandler } from './controller';

const router = Router();

/**
 * GET /admin/stats
 * Get platform statistics
 * Required permission: admin.stats.read
 */
router.get(
  '/',
  requireAuth,
  requireActiveStaff,
  requirePermission('admin.stats.read'),
  getStatsHandler
);

export default router;
