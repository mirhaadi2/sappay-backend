/**
 * Staff Routes
 * API endpoints for staff CRUD operations
 */

import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../admin/middleware';
import { activateStaffHandler, createStaffHandler, deleteStaffHandler, getStaffByIdHandler, listStaffHandler, suspendStaffHandler, updateStaffHandler } from './controller';

const router = Router();

/**
 * All staff routes require:
 * 1. Authentication (requireAuth)
 * 2. Active staff status (requireActiveStaff)
 * 3. Specific permissions
 */

// ===================== STAFF LISTING & RETRIEVAL =====================

/**
 * GET /staff
 * List all staff members
 * Required permission: admin.staff.read
 */
router.get(
    '/',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.staff.read'),
    listStaffHandler
);

/**
 * GET /staff/:id
 * Get specific staff member details
 * Required permission: admin.staff.read
 */
router.get(
    '/:id',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.staff.read'),
    getStaffByIdHandler
);

// ===================== STAFF CREATION & MODIFICATION =====================

/**
 * POST /staff
 * Create new staff member
 * Required permission: admin.staff.create
 */
router.post(
    '/',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.staff.create'),
    createStaffHandler
);

/**
 * PATCH /staff/:id
 * Update staff member information
 * Required permission: admin.staff.update
 */
router.patch(
    '/:id',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.staff.update'),
    updateStaffHandler
);

// ===================== STAFF STATUS MANAGEMENT =====================

/**
 * POST /staff/:id/suspend
 * Suspend staff member (deactivate)
 * Required permission: admin.staff.suspend
 */
router.post(
    '/:id/suspend',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.staff.suspend'),
    suspendStaffHandler
);

/**
 * POST /staff/:id/activate
 * Activate staff member
 * Required permission: admin.staff.suspend (using same permission for both actions)
 */
router.post(
    '/:id/activate',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.staff.suspend'),
    activateStaffHandler
);

// ===================== STAFF DELETION =====================

/**
 * DELETE /staff/:id
 * Delete staff member (soft delete)
 * Required permission: admin.staff.delete
 */
router.delete(
    '/:id',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.staff.delete'),
    deleteStaffHandler
);

export { router as staffRouter };
