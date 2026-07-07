import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import { Farmer } from '../model';

interface FarmerProductAttributes {
    id: string;
    farmerId: string;
    name: string;
    category: string;
    unit: string;
    pricePerUnit?: number | null;
    description?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type FarmerProductCreationAttributes = Optional<FarmerProductAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class FarmerProduct extends Model<FarmerProductAttributes, FarmerProductCreationAttributes> implements FarmerProductAttributes {
    public id!: string;
    public farmerId!: string;
    public name!: string;
    public category!: string;
    public unit!: string;
    public pricePerUnit?: number | null;
    public description?: string | null;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

FarmerProduct.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, unique: true },
        farmerId: { type: DataTypes.UUID, allowNull: false, field: 'farmer_id' },
        name: { type: DataTypes.STRING(255), allowNull: false },
        category: { type: DataTypes.STRING(100), allowNull: false },
        unit: { type: DataTypes.STRING(50), allowNull: false },
        pricePerUnit: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'price_per_unit' },
        description: { type: DataTypes.TEXT, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    {
        sequelize,
        tableName: 'farmer_products',
        timestamps: true,
        paranoid: true,
    }
);

Farmer.hasMany(FarmerProduct, { foreignKey: 'farmerId', as: 'products' });
FarmerProduct.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });
