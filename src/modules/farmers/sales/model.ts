import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import { Farmer } from '../model';
import { FarmerProduct } from '../products/model';

interface FarmerSaleAttributes {
    id: string;
    farmerId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    soldAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type FarmerSaleCreationAttributes = Optional<FarmerSaleAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class FarmerSale extends Model<FarmerSaleAttributes, FarmerSaleCreationAttributes> implements FarmerSaleAttributes {
    public id!: string;
    public farmerId!: string;
    public productId!: string;
    public quantity!: number;
    public unitPrice!: number;
    public totalAmount!: number;
    public soldAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

FarmerSale.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, unique: true },
        farmerId: { type: DataTypes.UUID, allowNull: false, field: 'farmer_id' },
        productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
        quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'unit_price' },
        totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'total_amount' },
        soldAt: { type: DataTypes.DATE, allowNull: false, field: 'sold_at' },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    {
        sequelize,
        tableName: 'farmer_sales',
        timestamps: true,
        paranoid: true,
    }
);

Farmer.hasMany(FarmerSale, { foreignKey: 'farmerId', as: 'sales' });
FarmerSale.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });
FarmerSale.belongsTo(FarmerProduct, { foreignKey: 'productId', as: 'product' });
