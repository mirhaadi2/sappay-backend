import { Router } from 'express';
import { requirePermission } from '../middleware';
import { adminListBulkOrdersHandler, adminUpdateBulkOrderStatusHandler } from './controller';

const router = Router();

/**
 * GET /admin/bulk-orders
 * List bulk orders with pagination and filtering
 * Required permission: admin.bulk-orders.read
 */
router.get(
    '/',
    requirePermission('admin.bulk-orders.read'),
    adminListBulkOrdersHandler
);

/**
 * PUT /admin/bulk-orders/:id/status
 * Update bulk order status
 * Required permission: admin.bulk-orders.update
 */
router.put(
    '/:id/status',
    requirePermission('admin.bulk-orders.update'),
    adminUpdateBulkOrderStatusHandler
);

export { router as adminBulkOrdersRoutes };