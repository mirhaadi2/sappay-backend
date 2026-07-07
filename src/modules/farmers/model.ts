import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

export enum FarmerStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    SUSPENDED = 'SUSPENDED',
    REJECTED = 'REJECTED',
}

interface FarmerAttributes {
    id: string;
    fullName: string;
    mobileNumber: string;
    email?: string | null;
    village: string;
    district: string;
    aadhaarNumber?: string | null;
    password?: string | null;
    status: FarmerStatus;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type FarmerCreationAttributes = Optional<FarmerAttributes, 'id' | 'status' | 'metadata' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class Farmer extends Model<FarmerAttributes, FarmerCreationAttributes> implements FarmerAttributes {
    public id!: string;
    public fullName!: string;
    public mobileNumber!: string;
    public email?: string | null;
    public village!: string;
    public district!: string;
    public aadhaarNumber?: string | null;
    public password?: string | null;
    public status!: FarmerStatus;
    public metadata?: Record<string, any>;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

Farmer.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
        },
        fullName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'full_name',
        },
        mobileNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            field: 'mobile_number',
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            field: 'email',
        },
        village: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'village',
        },
        district: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'district',
        },
        aadhaarNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
            field: 'aadhaar_number',
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'password',
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'deleted_at',
        },
    },
    {
        sequelize,
        tableName: 'farmers',
        timestamps: true,
        paranoid: true,
    }
);
