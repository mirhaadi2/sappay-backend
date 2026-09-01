import { Op, Transaction } from 'sequelize';
import { Admin } from './admin.model';
import { Role, Permission, RolePermission, StaffRole, AuditLog } from './models';
import { Staff } from '../staff/models';

export const findAllAdmins = async () => {
    return Admin.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
    });
};

export const findAdminById = async (id: string, transaction?: Transaction) => {
    return Admin.findByPk(id, {
        transaction,
        attributes: { exclude: ['password'] },
    });
};

export const findAdminByEmail = async (email: string, transaction?: Transaction) => {
    return Admin.findOne({
        where: { email },
        transaction,
    });
};

export const createAdminRecord = async (
    data: {
        email: string;
        password: string;
        name?: string;
        phone?: string;
        status?: string;
    },
    transaction?: Transaction,
) => {
    return Admin.create(
        {
            email: data.email,
            password: data.password,
            name: data.name?.trim(),
            phone: data.phone?.trim(),
            status: (data.status as any) ?? 'active',
        },
        { transaction },
    );
};

export const updateAdminRecord = async (
    admin: Admin,
    data: { email?: string; name?: string; phone?: string; status?: string },
    transaction?: Transaction,
) => {
    if (data.email) {
        admin.email = data.email.toLowerCase().trim();
    }

    if (data.name !== undefined) {
        admin.name = data.name?.trim();
    }

    if (data.phone !== undefined) {
        admin.phone = data.phone?.trim();
    }

    if (data.status !== undefined) {
        admin.status = data.status as any;
    }

    await admin.save({ transaction });
    return admin;
};

export const deleteAdminRecord = async (id: string, transaction?: Transaction) => {
    const admin = await Admin.findByPk(id, { transaction });

    if (!admin) {
        return null;
    }

    await admin.destroy({ transaction });
    return admin;
};

export const listRolesRecord = async (
    filters: {
        type?: 'admin' | 'staff';
        includeDeleted?: boolean;
        limit?: number;
        offset?: number;
    } = {},
) => {
    const where: any = {};

    if (filters.type) {
        where.type = filters.type;
    }

    const { count, rows } = await Role.findAndCountAll({
        where,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        order: [['name', 'ASC']],
        paranoid: !filters.includeDeleted,
    });

    return {
        roles: rows,
        total: count,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
    };
};

export const getRoleByIdRecord = async (roleId: string, transaction?: Transaction) =>
    Role.findByPk(roleId, {
        transaction,
        include: [
            {
                model: RolePermission,
                as: 'rolePermissions',
                include: [
                    {
                        model: Permission,
                        attributes: ['id', 'code', 'name', 'description', 'category'],
                    },
                ],
            },
        ],
    });

export const getRoleByCodeRecord = async (code: string, transaction?: Transaction) =>
    Role.findOne({
        where: { code },
        transaction,
        include: [
            {
                model: RolePermission,
                as: 'rolePermissions',
                include: [
                    {
                        model: Permission,
                        attributes: ['id', 'code', 'name', 'description', 'category'],
                    },
                ],
            },
        ],
    });

export const createRoleRecord = async (
    data: {
        code: string;
        name: string;
        description?: string;
        type: 'admin' | 'staff';
        permissionIds?: string[];
    },
    actorId: string,
    transaction?: Transaction,
) => {
    const existing = await Role.findOne({
        where: { code: data.code },
        transaction,
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
        { transaction },
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
        { transaction },
    );

    return role;
};

export const updateRoleRecord = async (
    roleId: string,
    data: {
        name?: string;
        description?: string;
        permissionIds?: string[];
    },
    actorId: string,
    transaction?: Transaction,
) => {
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
        { transaction },
    );

    return role;
};

export const deleteRoleRecord = async (
    roleId: string,
    actorId: string,
    transaction?: Transaction,
) => {
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
        { transaction },
    );
};

export const listPermissionsRecord = async () =>
    Permission.findAll({
        attributes: ['id', 'code', 'name', 'category', 'description'],
        order: [
            ['category', 'ASC'],
            ['name', 'ASC'],
        ],
    });

export const assignRoleToStaffRecord = async (
    staffId: string,
    roleId: string,
    actorId: string,
    notes?: string,
    transaction?: Transaction,
) => {
    const role = await Role.findByPk(roleId, { transaction });
    if (!role) throw new Error(`Role not found with ID: ${roleId}`);

    const existing = await StaffRole.findOne({
        where: {
            staffId,
            roleId,
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
        { transaction },
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
        { transaction },
    );

    return staffRole;
};

export const revokeRoleFromStaffRecord = async (
    staffRoleId: string,
    actorId: string,
    transaction?: Transaction,
) => {
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
        { transaction },
    );
};

export const getStaffRolesRecord = async (staffId: string) =>
    StaffRole.findAll({
        where: { staffId },
        include: [{ model: Role, attributes: ['id', 'code', 'name', 'type', 'description'] }],
        order: [['assignedAt', 'DESC']],
    });

export const getStaffPermissionsRecord = async (staffId: string): Promise<string[]> => {
    const staffRoles = await StaffRole.findAll({
        where: {
            staffId,
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

export const listAuditLogsRecord = async (
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

export const findRoleByStaffIdRecord = async (staffId: string) =>
    Staff.findByPk(staffId, {
        include: [{ model: Role, as: 'roles', attributes: ['id', 'code', 'name', 'type'] }],
    });
