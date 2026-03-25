import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import Product from './product.model';

export interface ProductVariantAttributes {
  id: string;
  productId: string;
  sku?: string;
  price: number;
  weight?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

type ProductVariantCreationAttributes = Optional<
  ProductVariantAttributes,
  'id' | 'sku' | 'weight' | 'status' | 'createdAt' | 'updatedAt'
>;

export class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes>
  implements ProductVariantAttributes {
  public id!: string;
  public productId!: string;
  public sku?: string;
  public price!: number;
  public weight?: number;
  public status!: 'ACTIVE' | 'INACTIVE';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductVariant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: false,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
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
  },
  {
    sequelize,
    tableName: 'product_variants',
    timestamps: true,
    paranoid: false,
  }
);

ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants' });
