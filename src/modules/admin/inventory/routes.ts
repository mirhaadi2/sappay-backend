import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import {
    listInventoryHandler,
    getProductInventoryHandler,
    updateInventoryHandler,
    addStockHandler,
    removeStockHandler,
    getInventoryHistoryHandler,
    getInventoryStatsHandler,
} from './controller';

const router = Router();

// All inventory routes require authentication and active staff status
router.use(requireAuth);
router.use(requireActiveStaff);

// List inventory with filtering and pagination
router.get(
    '/',
    requirePermission('admin.inventory.read'),
    listInventoryHandler
);

// Get inventory statistics
router.get(
    '/stats',
    requirePermission('admin.inventory.read'),
    getInventoryStatsHandler
);

// Get inventory for a specific product
router.get(
    '/product/:productId',
    requirePermission('admin.inventory.read'),
    getProductInventoryHandler
);

// Update inventory item
router.put(
    '/:inventoryId',
    requirePermission('admin.inventory.update'),
    updateInventoryHandler
);

// Add stock to inventory
router.post(
    '/:inventoryId/add-stock',
    requirePermission('admin.inventory.update'),
    addStockHandler
);

// Remove stock from inventory
router.post(
    '/:inventoryId/remove-stock',
    requirePermission('admin.inventory.update'),
    removeStockHandler
);

// Get inventory history
router.get(
    '/history',
    requirePermission('admin.inventory.read'),
    getInventoryHistoryHandler
);

export default router;