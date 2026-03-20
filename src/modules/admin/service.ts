/**
 * Admin Service
 * Business logic for roles, permissions, and staff role management
 */

import { Role, Permission, RolePermission, StaffRole, AuditLog } from './models';
import { sequelize } from '../../db/sequelize';
import { Op } from 'sequelize';

/**
 * List roles with pagination and filters
 */
export const listRoles = async (filters: {
    type?: 'admin' | 'staff';
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
} = {}) => {
    const where: any = {};

    if (filters.type) {
        where.type = filters.type;
    }

    const { count, rows } = await Role.findAndCountAll({
        where,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        order: [['name', 'ASC']],
        paranoid: !filters.includeDeleted, // If false, includes soft-deleted roles
    });

    return {
        roles: rows,
        total: count,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
    };
};

/**
 * Get role by ID with all associated permissions
 */
export const getRoleById = async (roleId: string) => {
    const role = await Role.findByPk(roleId, {
        include: [
            {
                model: RolePermission,
                as: 'rolePermissions',
                include: [{ model: Permission, attributes: ['id', 'code', 'name', 'description', 'category'] }]
            },
        ],
    });

    if (!role) {
        throw new Error(`Role not found with ID: ${roleId}`);
    }

    return role;
};

/**
 * Get role by unique string code
 */
export const getRoleByCode = async (code: string) => {
    return Role.findOne({
        where: { code },
        include: [
            {
                model: RolePermission,
                as: 'rolePermissions',
                include: [{ model: Permission, attributes: ['id', 'code', 'name', 'description', 'category'] }]
            },
        ],
    });
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
    actorId: string
) => {
    const transaction = await sequelize.transaction();

    try {
        const existing = await Role.findOne({
            where: { code: data.code },
        });

        if (existing) {
            throw new Error(`Role with code '${data.code}' already exists`);
        }

        const role = await Role.create(
            {
                code: data.code,
                name: data.name,
                description: data.description,
                type: data.type,
                isSystem: false,
            },
            { transaction }
        );

        if (data.permissionIds && data.permissionIds.length > 0) {
            const rolePermissions = data.permissionIds.map((permId) => ({
                roleId: role.id,
                permissionId: permId,
            }));
            await RolePermission.bulkCreate(rolePermissions, { transaction });
        }

        await AuditLog.create(
            {
                actorStaffId: actorId,
                targetStaffId: actorId,
                action: 'created',
                resourceType: 'role',
                resourceId: role.id,
                newValue: {
                    code: role.code,
                    name: role.name,
                    type: role.type,
                    permissions: data.permissionIds || [],
                },
            },
            { transaction }
        );

        await transaction.commit();
        return role;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
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
    actorId: string
) => {
    const transaction = await sequelize.transaction();

    try {
        const role = await Role.findByPk(roleId, { transaction });

        if (!role) {
            throw new Error(`Role not found with ID: ${roleId}`);
        }

        if (role.isSystem) {
            throw new Error('System roles cannot be modified');
        }

        const oldValue = {
            name: role.name,
            description: role.description,
        };

        if (data.name !== undefined) role.name = data.name;
        if (data.description !== undefined) role.description = data.description;

        await role.save({ transaction });

        if (data.permissionIds !== undefined) {
            await RolePermission.destroy({ where: { roleId }, transaction });

            if (data.permissionIds.length > 0) {
                const rolePermissions = data.permissionIds.map((permId) => ({
                    roleId,
                    permissionId: permId,
                }));
                await RolePermission.bulkCreate(rolePermissions, { transaction });
            }
        }

        await AuditLog.create(
            {
                actorStaffId: actorId,
                targetStaffId: actorId,
                action: 'updated',
                resourceType: 'role',
                resourceId: roleId,
                oldValue,
                newValue: {
                    name: role.name,
                    description: role.description,
                    permissions: data.permissionIds || [],
                },
            },
            { transaction }
        );

        await transaction.commit();
        return role;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Soft delete role (checks if currently assigned first)
 */
export const deleteRole = async (roleId: string, actorId: string) => {
    const transaction = await sequelize.transaction();

    try {
        const role = await Role.findByPk(roleId, { transaction });

        if (!role) {
            throw new Error(`Role not found with ID: ${roleId}`);
        }

        if (role.isSystem) {
            throw new Error('System roles cannot be deleted');
        }

        const assignedCount = await StaffRole.count({
            where: {
                roleId,
                // revokedAt: null 
            },
            transaction,
        });

        if (assignedCount > 0) {
            throw new Error(`Role is assigned to ${assignedCount} staff members. Revoke first.`);
        }

        await role.destroy({ transaction });

        await AuditLog.create(
            {
                actorStaffId: actorId,
                targetStaffId: actorId,
                action: 'deleted',
                resourceType: 'role',
                resourceId: roleId,
                oldValue: {
                    code: role.code,
                    name: role.name,
                    type: role.type,
                },
            },
            { transaction }
        );

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * List all permissions grouped by category for UI display
 */
export const listPermissions = async () => {
    const permissions = await Permission.findAll({
        attributes: ['id', 'code', 'name', 'category', 'description'],
        order: [['category', 'ASC'], ['name', 'ASC']],
    });

    return permissions.reduce(
        (acc: Record<string, any[]>, perm) => {
            const category = perm.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(perm);
            return acc;
        },
        {}
    );
};

/**
 * Assign a specific role to a staff member
 */
export const assignRoleToStaff = async (
    staffId: string,
    roleId: string,
    actorId: string,
    notes?: string
) => {
    const transaction = await sequelize.transaction();

    try {
        const role = await Role.findByPk(roleId, { transaction });
        if (!role) throw new Error(`Role not found with ID: ${roleId}`);

        const existing = await StaffRole.findOne({
            where: {
                staffId, roleId,
                // revokedAt: null 
            },
            transaction,
        });

        if (existing) throw new Error(`Staff member already has role: ${role.name}`);

        const staffRole = await StaffRole.create(
            {
                staffId,
                roleId,
                assignedBy: actorId,
                assignedAt: new Date(),
                notes,
            },
            { transaction }
        );

        await AuditLog.create(
            {
                actorStaffId: actorId,
                targetStaffId: staffId,
                action: 'assigned_role',
                resourceType: 'staff_role',
                resourceId: staffRole.id,
                newValue: { roleId, roleName: role.name },
            },
            { transaction }
        );

        await transaction.commit();
        return staffRole;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Revoke (soft deactivate) a role assignment
 */
export const revokeRoleFromStaff = async (staffRoleId: string, actorId: string) => {
    const transaction = await sequelize.transaction();

    try {
        const staffRole = await StaffRole.findByPk(staffRoleId, { transaction });

        if (!staffRole) throw new Error(`Staff role assignment not found: ${staffRoleId}`);
        if (staffRole.revokedAt) throw new Error('Role assignment already revoked');

        staffRole.revokedAt = new Date();
        await staffRole.save({ transaction });

        await AuditLog.create(
            {
                actorStaffId: actorId,
                targetStaffId: staffRole.staffId,
                action: 'removed_role',
                resourceType: 'staff_role',
                resourceId: staffRoleId,
                oldValue: { roleId: staffRole.roleId },
            },
            { transaction }
        );

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Fetch all roles (current and past) for a specific staff member
 */
export const getStaffRoles = async (staffId: string) => {
    return StaffRole.findAll({
        where: { staffId },
        include: [{ model: Role, attributes: ['id', 'code', 'name', 'type', 'description'] }],
        order: [['assignedAt', 'DESC']],
    });
};

/**
 * Get flat list of all permission codes for a staff member (used for authorization checks)
 */
export const getStaffPermissions = async (staffId: string): Promise<string[]> => {
    const staffRoles = await StaffRole.findAll({
        where: {
            staffId,
            // revokedAt: null 
        },
        attributes: ['roleId'],
        raw: true,
    });

    if (staffRoles.length === 0) return [];

    const roleIds = staffRoles.map((sr) => sr.roleId);

    const rolePermissions = await RolePermission.findAll({
        where: { roleId: roleIds },
        include: [{ model: Permission, attributes: ['code'], required: true }],
        raw: true,
    });

    return rolePermissions.map((rp: any) => rp['Permission.code']);
};

/**
 * List audit logs with pagination and filters
 */
export const listAuditLogs = async (filters: {
    actorId?: string;
    targetStaffId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
} = {}) => {
    const where: any = {};

    if (filters.actorId) where.actorStaffId = filters.actorId;
    if (filters.targetStaffId) where.targetStaffId = filters.targetStaffId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;

    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt[Op.gte] = filters.startDate;
        if (filters.endDate) where.createdAt[Op.lte] = filters.endDate;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
        where,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        order: [['createdAt', 'DESC']],
    });

    return {
        logs: rows,
        total: count,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
    };
};