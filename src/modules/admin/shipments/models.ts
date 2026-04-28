import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import { Order } from '../orders/order.model';

// ===================== SHIPMENT MODEL =====================
interface ShipmentAttributes {
    id: string;
    orderId: string;
    uploadWbn: string; // Delhivery's batch upload waybill number
    courier: 'delhivery' | 'other'; // Can be extended for other couriers
    status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED' | 'RTO';
    totalPackages: number;
    totalCodAmount: number;
    cashPickupsCount: number;
    packageCount: number;
    prepaidCount: number;
    pickupsCount: number;
    replacementCount: number;
    cashPickups: number;
    codAmount: number;
    codCount: number;
    metadata?: Record<string, any>; // Store additional courier-specific data
    createdAt: Date;
    updatedAt: Date;
}

type ShipmentCreationAttributes = Optional<
    ShipmentAttributes,
    'id' | 'status' | 'metadata' | 'createdAt' | 'updatedAt'
>;

export class Shipment extends Model<ShipmentAttributes, ShipmentCreationAttributes> implements ShipmentAttributes {
    public id!: string;
    public orderId!: string;
    public uploadWbn!: string;
    public courier!: 'delhivery' | 'other';
    public status!: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED' | 'RTO';
    public totalPackages!: number;
    public totalCodAmount!: number;
    public cashPickupsCount!: number;
    public packageCount!: number;
    public prepaidCount!: number;
    public pickupsCount!: number;
    public replacementCount!: number;
    public cashPickups!: number;
    public codAmount!: number;
    public codCount!: number;
    public metadata?: Record<string, any>;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Association
    public readonly order?: Order;
    public readonly packages?: ShipmentPackage[];
}

Shipment.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'orders', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            field: 'order_id'
        },
        uploadWbn: { type: DataTypes.STRING(100), allowNull: false, field: 'upload_wbn' },
        courier: { type: DataTypes.ENUM('delhivery', 'other'), allowNull: false, defaultValue: 'delhivery' },
        status: {
            type: DataTypes.ENUM('CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED', 'RTO'),
            allowNull: false,
            defaultValue: 'CREATED'
        },
        totalPackages: { type: DataTypes.INTEGER, allowNull: false, field: 'total_packages' },
        totalCodAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'total_cod_amount' },
        cashPickupsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'cash_pickups_count' },
        packageCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'package_count' },
        prepaidCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'prepaid_count' },
        pickupsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'pickups_count' },
        replacementCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'replacement_count' },
        cashPickups: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'cash_pickups' },
        codAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'cod_amount' },
        codCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'cod_count' },
        metadata: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
    },
    { sequelize, tableName: 'shipments', timestamps: true, underscored: true }
);

// ===================== SHIPMENT PACKAGE MODEL =====================
interface ShipmentPackageAttributes {
    id: string;
    shipmentId: string;
    waybill: string; // Individual package tracking number
    refnum: string; // Reference number from Delhivery
    client: string; // Client identifier
    payment: 'COD' | 'Prepaid';
    codAmount: number;
    status: 'Success' | 'Failed' | 'In Transit' | 'Delivered' | 'Cancelled' | 'RTO';
    sortCode: string;
    serviceable: boolean;
    remarks: string[]; // Array of remarks
    metadata?: Record<string, any>; // Additional package-specific data
    createdAt: Date;
    updatedAt: Date;
}

type ShipmentPackageCreationAttributes = Optional<
    ShipmentPackageAttributes,
    'id' | 'metadata' | 'createdAt' | 'updatedAt'
>;

export class ShipmentPackage extends Model<ShipmentPackageAttributes, ShipmentPackageCreationAttributes> implements ShipmentPackageAttributes {
    public id!: string;
    public shipmentId!: string;
    public waybill!: string;
    public refnum!: string;
    public client!: string;
    public payment!: 'COD' | 'Prepaid';
    public codAmount!: number;
    public status!: 'Success' | 'Failed' | 'In Transit' | 'Delivered' | 'Cancelled' | 'RTO';
    public sortCode!: string;
    public serviceable!: boolean;
    public remarks!: string[];
    public metadata?: Record<string, any>;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Association
    public readonly shipment?: Shipment;
}

ShipmentPackage.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        shipmentId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'shipments', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            field: 'shipment_id'
        },
        waybill: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        refnum: { type: DataTypes.STRING(255), allowNull: false },
        client: { type: DataTypes.STRING(255), allowNull: false },
        payment: { type: DataTypes.ENUM('COD', 'Prepaid'), allowNull: false },
        codAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'cod_amount' },
        status: {
            type: DataTypes.ENUM('Success', 'Failed', 'In Transit', 'Delivered', 'Cancelled', 'RTO'),
            allowNull: false,
            defaultValue: 'Success'
        },
        sortCode: { type: DataTypes.STRING(50), allowNull: false, field: 'sort_code' },
        serviceable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        remarks: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
        metadata: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
    },
    { sequelize, tableName: 'shipment_packages', timestamps: true, underscored: true }
);

// ===================== ASSOCIATIONS =====================
Shipment.hasMany(ShipmentPackage, {
    foreignKey: 'shipmentId',
    as: 'packages',
    onDelete: 'CASCADE'
});

ShipmentPackage.belongsTo(Shipment, {
    foreignKey: 'shipmentId',
    as: 'shipment',
    onDelete: 'CASCADE'
});

Shipment.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order',
    onDelete: 'CASCADE'
});

Order.hasMany(Shipment, {
    foreignKey: 'orderId',
    as: 'shipments',
    onDelete: 'CASCADE'
});