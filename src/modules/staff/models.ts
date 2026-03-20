/**
 * Staff Module Models
 * Database models for staff members
 */

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

// ===================== STAFF MODEL =====================

interface StaffAttributes {
    id: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
    status: 'active' | 'inactive' | 'suspended';
    department?: string;
    manager_id?: string;
    hire_date?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type StaffCreationAttributes = Optional<
    StaffAttributes,
    'id' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Staff extends Model<StaffAttributes, StaffCreationAttributes> implements StaffAttributes {
    public id!: string;
    public email!: string;
    public password!: string;
    public name!: string;
    public phone?: string;
    public status!: 'active' | 'inactive' | 'suspended';
    public department?: string;
    public manager_id?: string;
    public hire_date?: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

Staff.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active',
        },
        department: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        manager_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        hire_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'staff',
        timestamps: true,
        paranoid: true,
        underscored: true,
    }
);
