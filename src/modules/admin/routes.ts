/**
 * Admin Routes
 * API endpoints for role and permission management
 * Staff CRUD routes are in staff module
 */

import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from './middleware';
import { assignRoleToStaffHandler, createRoleHandler, deleteRoleHandler, getRoleByIdHandler, getStaffPermissionsHandler, getStaffRolesHandler, listAuditLogsHandler, listPermissionsHandler, listRolesHandler, revokeRoleFromStaffHandler, updateRoleHandler } from './controller';
import { websiteAdminRoutes } from './website';
import { inventoryRoutes } from './inventory';

const router = Router();

/**
 * All admin routes require:
 * 1. Authentication (requireAuth)
 * 2. Active staff status (requireActiveStaff)
 * 3. Specific permissions
 */

// ===================== ROLE MANAGEMENT ENDPOINTS =====================

/**
 * GET /admin/roles
 * List all roles
 * Required permission: admin.roles.read
 */
router.get(
    '/roles',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.read'),
    listRolesHandler
);

/**
 * GET /admin/roles/:id
 * Get specific role with permissions
 * Required permission: admin.roles.read
 */
router.get(
    '/roles/:id',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.read'),
    getRoleByIdHandler
);

/**
 * POST /admin/roles
 * Create new role
 * Required permission: admin.roles.create
 */
router.post(
    '/roles',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.create'),
    createRoleHandler
);

/**
 * PATCH /admin/roles/:id
 * Update role details and permissions
 * Required permission: admin.roles.update
 */
router.patch(
    '/roles/:id',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.update'),
    updateRoleHandler
);

/**
 * DELETE /admin/roles/:id
 * Delete role (soft delete)
 * Required permission: admin.roles.delete
 */
router.delete(
    '/roles/:id',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.delete'),
    deleteRoleHandler
);

// ===================== PERMISSION ENDPOINTS =====================

/**
 * GET /admin/permissions
 * List all permissions grouped by category
 * Required permission: admin.roles.read
 */
router.get(
    '/permissions',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.read'),
    listPermissionsHandler
);

// ===================== STAFF ROLE ASSIGNMENT ENDPOINTS =====================

/**
 * GET /admin/staff/:staffId/roles
 * Get all roles assigned to staff
 * Required permission: admin.roles.read
 */
router.get(
    '/staff/:staffId/roles',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.read'),
    getStaffRolesHandler
);

/**
 * GET /admin/staff/:staffId/permissions
 * Get all permissions for staff
 * Required permission: admin.roles.read
 */
router.get(
    '/staff/:staffId/permissions',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.read'),
    getStaffPermissionsHandler
);

/**
 * POST /admin/staff/:staffId/roles
 * Assign role to staff
 * Required permission: admin.roles.assign
 */
router.post(
    '/staff/:staffId/roles',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.assign'),
    assignRoleToStaffHandler
);

/**
 * DELETE /admin/staff/:staffId/roles/:staffRoleId
 * Revoke role from staff
 * Required permission: admin.roles.assign
 */
router.delete(
    '/staff/:staffId/roles/:staffRoleId',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.roles.assign'),
    revokeRoleFromStaffHandler
);

// ===================== AUDIT LOG ENDPOINTS =====================

/**
 * GET /admin/audit-logs
 * View audit logs with filters
 * Required permission: admin.audit.read
 */
router.get(
    '/audit-logs',
    requireAuth,
    requireActiveStaff,
    requirePermission('admin.audit.read'),
    listAuditLogsHandler
);

// ===================== HOMEPAGE MANAGEMENT ENDPOINTS =====================
router.use('/website', websiteAdminRoutes);

// ===================== INVENTORY MANAGEMENT ENDPOINTS =====================
router.use('/inventory', inventoryRoutes);

export { router as adminRouter };
