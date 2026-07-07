import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import { Farmer } from '../model';
import { FarmerProduct } from '../products/model';

interface FarmerInventoryAttributes {
    id: string;
    farmerId: string;
    productId: string;
    quantity: number;
    unit: string;
    batchNumber?: string | null;
    expiryDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type FarmerInventoryCreationAttributes = Optional<FarmerInventoryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class FarmerInventory extends Model<FarmerInventoryAttributes, FarmerInventoryCreationAttributes> implements FarmerInventoryAttributes {
    public id!: string;
    public farmerId!: string;
    public productId!: string;
    public quantity!: number;
    public unit!: string;
    public batchNumber?: string | null;
    public expiryDate?: Date | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

FarmerInventory.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, unique: true },
        farmerId: { type: DataTypes.UUID, allowNull: false, field: 'farmer_id' },
        productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
        quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        unit: { type: DataTypes.STRING(50), allowNull: false },
        batchNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'batch_number' },
        expiryDate: { type: DataTypes.DATE, allowNull: true, field: 'expiry_date' },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    {
        sequelize,
        tableName: 'farmer_inventory',
        timestamps: true,
        paranoid: true,
    }
);

Farmer.hasMany(FarmerInventory, { foreignKey: 'farmerId', as: 'inventory' });
FarmerInventory.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });
FarmerInventory.belongsTo(FarmerProduct, { foreignKey: 'productId', as: 'product' });
