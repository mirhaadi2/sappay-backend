import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';
import { Staff } from '../staff/models';

// ===================== ROLE MODEL =====================
interface RoleAttributes {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: 'admin' | 'staff';
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type RoleCreationAttributes = Optional<RoleAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isSystem'>;

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    public id!: string;
    public code!: string;
    public name!: string;
    public description?: string;
    public type!: 'admin' | 'staff';
    public isSystem!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

Role.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        type: { type: DataTypes.ENUM('admin', 'staff'), allowNull: false },
        isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_system' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'roles', timestamps: true, paranoid: true, underscored: true }
);

// ===================== PERMISSION MODEL =====================
interface PermissionAttributes {
    id: string;
    code: string;
    name: string;
    description?: string;
    category?: string;
    createdAt: Date;
    updatedAt: Date;
}

type PermissionCreationAttributes = Optional<PermissionAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    public id!: string;
    public code!: string;
    public name!: string;
    public description?: string;
    public category?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Permission.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        category: { type: DataTypes.STRING(100), allowNull: true },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
    },
    { sequelize, tableName: 'permissions', timestamps: true, underscored: true }
);

// ===================== ROLE_PERMISSION JUNCTION =====================
interface RolePermissionAttributes {
    id: string;
    roleId: string;
    permissionId: string;
    createdAt: Date;
}

export class RolePermission extends Model<RolePermissionAttributes, Optional<RolePermissionAttributes, 'id' | 'createdAt'>> implements RolePermissionAttributes {
    public id!: string;
    public roleId!: string;
    public permissionId!: string;
    public readonly createdAt!: Date;
}

RolePermission.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        roleId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'role_id',
            references: { model: Role, key: 'id' }
        },
        permissionId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'permission_id',
            references: { model: Permission, key: 'id' }
        },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
    },
    { sequelize, tableName: 'role_permissions', timestamps: false, underscored: true }
);

// ===================== STAFF_ROLE JUNCTION =====================
interface StaffRoleAttributes {
    id: string;
    staffId: string;
    roleId: string;
    assignedBy: string;
    assignedAt: Date;
    revokedAt?: Date;
    notes?: string;
}

export class StaffRole extends Model<StaffRoleAttributes, Optional<StaffRoleAttributes, 'id' | 'assignedAt' | 'revokedAt'>> implements StaffRoleAttributes {
    public id!: string;
    public staffId!: string;
    public roleId!: string;
    public assignedBy!: string;
    public assignedAt!: Date;
    public revokedAt?: Date;
    public notes?: string;
}

StaffRole.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        staffId: { type: DataTypes.UUID, allowNull: false, field: 'staff_id' },
        roleId: { type: DataTypes.UUID, allowNull: false, field: 'role_id', references: { model: Role, key: 'id' } },
        assignedBy: { type: DataTypes.UUID, allowNull: false, field: 'assigned_by' },
        assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'assigned_at' },
        revokedAt: { type: DataTypes.DATE, allowNull: true, field: 'revoked_at' },
        notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'staff_roles', timestamps: false, underscored: true }
);

// ===================== AUDIT LOG MODEL =====================
interface AuditLogAttributes {
    id: string;
    actorStaffId: string;
    targetStaffId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

export class AuditLog extends Model<AuditLogAttributes, Optional<AuditLogAttributes, 'id' | 'createdAt'>> implements AuditLogAttributes {
    public id!: string;
    public actorStaffId!: string;
    public targetStaffId!: string;
    public action!: string;
    public resourceType!: string;
    public resourceId?: string;
    public oldValue?: Record<string, any>;
    public newValue?: Record<string, any>;
    public ipAddress?: string;
    public userAgent?: string;
    public readonly createdAt!: Date;
}

AuditLog.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        actorStaffId: { type: DataTypes.UUID, allowNull: false, field: 'actor_staff_id' },
        targetStaffId: { type: DataTypes.UUID, allowNull: false, field: 'target_staff_id' },
        action: { type: DataTypes.STRING(50), allowNull: false },
        resourceType: { type: DataTypes.STRING(100), allowNull: false, field: 'resource_type' },
        resourceId: { type: DataTypes.UUID, allowNull: true, field: 'resource_id' },
        oldValue: { type: DataTypes.JSON, allowNull: true, field: 'old_value' },
        newValue: { type: DataTypes.JSON, allowNull: true, field: 'new_value' },
        ipAddress: { type: DataTypes.STRING(50), allowNull: true, field: 'ip_address' },
        userAgent: { type: DataTypes.TEXT, allowNull: true, field: 'user_agent' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
    },
    { sequelize, tableName: 'staff_audit_logs', timestamps: false, underscored: true }
);

// ===================== ASSOCIATIONS =====================

// Role <-> Permission (Many-to-Many)
Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions'
});
Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles'
});

// For direct access to junction if needed
Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'rolePermissions' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id' });

// Staff <-> Role (Many-to-Many via StaffRole)
Staff.belongsToMany(Role, {
    through: StaffRole,
    foreignKey: 'staff_id',
    otherKey: 'role_id',
    as: 'roles'
});
Role.belongsToMany(Staff, {
    through: StaffRole,
    foreignKey: 'role_id',
    otherKey: 'staff_id',
    as: 'staffMembers'
});

// Staff associations for roles and logs
Staff.hasMany(StaffRole, { foreignKey: 'staff_id', as: 'staffRoleAssignments' });
StaffRole.belongsTo(Staff, { foreignKey: 'staff_id' });
StaffRole.belongsTo(Role, { foreignKey: 'role_id' });

Staff.hasMany(AuditLog, { foreignKey: 'actor_staff_id', as: 'actionsPerformed' });
Staff.hasMany(AuditLog, { foreignKey: 'target_staff_id', as: 'actionsTargeting' });

AuditLog.belongsTo(Staff, { foreignKey: 'actor_staff_id', as: 'actor' });
AuditLog.belongsTo(Staff, { foreignKey: 'target_staff_id', as: 'targetStaff' });