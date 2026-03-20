/**
 * Admin Controller
 * HTTP request handlers for role and permission management
 * Staff CRUD is handled by StaffController in staff module
 */

import { Response } from 'express';
import { AuthenticatedRequest } from './middleware';
import { assignRoleToStaff, createRole, deleteRole, getRoleById, getStaffPermissions, getStaffRoles, listAuditLogs, listPermissions, listRoles, revokeRoleFromStaff, updateRole } from './service';

/**
 * GET /admin/roles
 * List all roles with pagination
 */
export const listRolesHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { type, includeDeleted, limit, offset } = req.query;
        const result = await listRoles({
            type: (type as any) || undefined,
            includeDeleted: includeDeleted === 'true',
            limit: limit ? parseInt(limit as string) : 20,
            offset: offset ? parseInt(offset as string) : 0,
        });
        res.json({
            success: true,
            data: result.roles,
            pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to list roles',
        });
    }
};

/**
 * GET /admin/roles/:id
 * Get role by ID with permissions
 */
export const getRoleByIdHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const role = await getRoleById(id);
        res.json({
            success: true,
            data: role,
        });
    } catch (error: any) {
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            error: error.message || 'Failed to fetch role',
        });
    }
};

/**
 * POST /admin/roles
 * Create new role
 */
export const createRoleHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { code, name, description, type, permissionIds } = req.body;
        if (!code || !name || !type) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: code, name, type',
            });
            return;
        }
        if (!['admin', 'staff'].includes(type)) {
            res.status(400).json({
                success: false,
                error: 'Type must be either "admin" or "staff"',
            });
            return;
        }
        const role = await createRole(
            {
                code,
                name,
                description,
                type,
                permissionIds: permissionIds || [],
            },
            req.staff!.id
        );
        res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: role,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create role',
        });
    }
};

/**
 * PATCH /admin/roles/:id
 * Update role details and permissions
 */
export const updateRoleHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, permissionIds } = req.body;
        if (!name && !description && !permissionIds) {
            res.status(400).json({
                success: false,
                error: 'At least one field must be provided for update',
            });
            return;
        }
        const role = await updateRole(
            id,
            {
                name,
                description,
                permissionIds,
            },
            req.staff!.id
        );
        res.json({
            success: true,
            message: 'Role updated successfully',
            data: role,
        });
    } catch (error: any) {
        res.status(error.message.includes('not found') ? 404 : 400).json({
            success: false,
            error: error.message || 'Failed to update role',
        });
    }
};

/**
 * DELETE /admin/roles/:id
 * Delete role (soft delete)
 */
export const deleteRoleHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        await deleteRole(id, req.staff!.id);
        res.json({
            success: true,
            message: 'Role deleted successfully',
        });
    } catch (error: any) {
        res.status(error.message.includes('not found') ? 404 : 400).json({
            success: false,
            error: error.message || 'Failed to delete role',
        });
    }
};

// ===================== PERMISSION ENDPOINTS =====================

/**
 * GET /admin/permissions
 * List all permissions grouped by category
 */
export const listPermissionsHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const permissions = await listPermissions();
        res.json({
            success: true,
            data: permissions,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to list permissions',
        });
    }
};

// ===================== STAFF ROLE ENDPOINTS =====================

/**
 * GET /admin/staff/:staffId/roles
 * Get all roles assigned to staff member
 */
export const getStaffRolesHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { staffId } = req.params;
        const roles = await getStaffRoles(staffId);
        res.json({
            success: true,
            data: roles,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch staff roles',
        });
    }
};

/**
 * GET /admin/staff/:staffId/permissions
 * Get all permissions for staff member
 */
export const getStaffPermissionsHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { staffId } = req.params;
        const permissions = await getStaffPermissions(staffId);
        res.json({
            success: true,
            data: permissions,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch staff permissions',
        });
    }
};

/**
 * POST /admin/staff/:staffId/roles
 * Assign role to staff member
 */
export const assignRoleToStaffHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { staffId } = req.params;
        const { roleId, notes } = req.body;
        if (!roleId) {
            res.status(400).json({
                success: false,
                error: 'roleId is required',
            });
            return;
        }
        const staffRole = await assignRoleToStaff(
            staffId,
            roleId,
            req.staff!.id,
            notes
        );
        res.status(201).json({
            success: true,
            message: 'Role assigned successfully',
            data: staffRole,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to assign role',
        });
    }
};

/**
 * DELETE /admin/staff/:staffId/roles/:staffRoleId
 * Revoke role from staff member
 */
export const revokeRoleFromStaffHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { staffId, staffRoleId } = req.params;
        await revokeRoleFromStaff(staffRoleId, req.staff!.id);
        res.json({
            success: true,
            message: 'Role revoked successfully',
        });
    } catch (error: any) {
        res.status(error.message.includes('not found') ? 404 : 400).json({
            success: false,
            error: error.message || 'Failed to revoke role',
        });
    }
};

// ===================== AUDIT LOG ENDPOINTS =====================

/**
 * GET /admin/audit-logs
 * Get audit logs with filters
 */
export const listAuditLogsHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { actorId, targetStaffId, action, resourceType, startDate, endDate, limit, offset } = req.query;
        const result = await listAuditLogs({
            actorId: (actorId as string) || undefined,
            targetStaffId: (targetStaffId as string) || undefined,
            action: (action as string) || undefined,
            resourceType: (resourceType as string) || undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0,
        });
        res.json({
            success: true,
            data: result.logs,
            pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch audit logs',
        });
    }
};
