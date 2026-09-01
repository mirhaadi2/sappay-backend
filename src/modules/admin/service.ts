/**
 * Admin Service
 * Business logic for roles, permissions, and staff role management
 */

import { Role, Permission, RolePermission, StaffRole, AuditLog } from './models';
import { sequelize } from '../../db/sequelize';
import { Op } from 'sequelize';
import { withTransaction } from '../../utils/transaction';
import {
    listRolesRecord,
    getRoleByIdRecord,
    getRoleByCodeRecord,
    createRoleRecord,
    updateRoleRecord,
    deleteRoleRecord,
    listPermissionsRecord,
    assignRoleToStaffRecord,
    revokeRoleFromStaffRecord,
    getStaffRolesRecord,
    getStaffPermissionsRecord,
    listAuditLogsRecord,
} from './repository';

/**
 * List roles with pagination and filters
 */
export const listRoles = async (
    filters: {
        type?: 'admin' | 'staff';
        includeDeleted?: boolean;
        limit?: number;
        offset?: number;
    } = {},
) => {
    return listRolesRecord(filters);
};

/**
 * Get role by ID with all associated permissions
 */
export const getRoleById = async (roleId: string) => {
    const role = await getRoleByIdRecord(roleId);

    if (!role) {
        throw new Error(`Role not found with ID: ${roleId}`);
    }

    return role;
};

/**
 * Get role by unique string code
 */
export const getRoleByCode = async (code: string) => {
    return getRoleByCodeRecord(code);
};

/**
 * Create new custom role with permissions and audit logging
 */
export const createRole = async (
    data: {
        code: string;
        name: string;
        description?: string;
        type: 'admin' | 'staff';
        permissionIds?: string[];
    },
    actorId: string,
) => {
    return withTransaction(async (transaction) => {
        return createRoleRecord(data, actorId, transaction);
    });
};

/**
 * Update role details and permissions
 */
export const updateRole = async (
    roleId: string,
    data: {
        name?: string;
        description?: string;
        permissionIds?: string[];
    },
    actorId: string,
) => {
    return withTransaction(async (transaction) => {
        return updateRoleRecord(roleId, data, actorId, transaction);
    });
};

/**
 * Soft delete role (checks if currently assigned first)
 */
export const deleteRole = async (roleId: string, actorId: string) => {
    return withTransaction(async (transaction) => {
        await deleteRoleRecord(roleId, actorId, transaction);
    });
};

/**
 * List all permissions grouped by category for UI display
 */
export const listPermissions = async () => {
    const permissions = await listPermissionsRecord();

    return permissions.reduce((acc: Record<string, any[]>, perm) => {
        const category = perm.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(perm);
        return acc;
    }, {});
};

/**
 * Assign a specific role to a staff member
 */
export const assignRoleToStaff = async (
    staffId: string,
    roleId: string,
    actorId: string,
    notes?: string,
) => {
    return withTransaction(async (transaction) => {
        return assignRoleToStaffRecord(staffId, roleId, actorId, notes, transaction);
    });
};

/**
 * Revoke (soft deactivate) a role assignment
 */
export const revokeRoleFromStaff = async (staffRoleId: string, actorId: string) => {
    return withTransaction(async (transaction) => {
        await revokeRoleFromStaffRecord(staffRoleId, actorId, transaction);
    });
};

/**
 * Fetch all roles (current and past) for a specific staff member
 */
export const getStaffRoles = async (staffId: string) => {
    return getStaffRolesRecord(staffId);
};

/**
 * Get flat list of all permission codes for a staff member (used for authorization checks)
 */
export const getStaffPermissions = async (staffId: string): Promise<string[]> => {
    return getStaffPermissionsRecord(staffId);
};

/**
 * List audit logs with pagination and filters
 */
export const listAuditLogs = async (
    filters: {
        actorId?: string;
        targetStaffId?: string;
        action?: string;
        resourceType?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    } = {},
) => {
    return listAuditLogsRecord(filters);
};
