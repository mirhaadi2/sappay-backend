import { Model, DataTypes, Optional } from 'sequelize';
import Product from '../model';
import { sequelize } from '../../../../db/sequelize';

export interface ProductVariantAttributes {
  id: string;
  productId: string;
  sku?: string;
  price: number;
  discountedPrice?: number;
  discountedPercent?: number;
  weight?: number;
  weightUnit?: 'G' | 'KG' | 'L' | 'ML';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

type ProductVariantCreationAttributes = Optional<
  ProductVariantAttributes,
  'id' | 'sku' | 'discountedPrice' | 'discountedPercent' | 'weight' | 'weightUnit' | 'status' | 'createdAt' | 'updatedAt'
>;

export class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes>
  implements ProductVariantAttributes {
  public id!: string;
  public productId!: string;
  public sku?: string;
  public price!: number;
  public discountedPrice?: number;
  public discountedPercent?: number;
  public weight?: number;
  public weightUnit?: 'G' | 'KG' | 'L' | 'ML';
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
    discountedPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'discounted_price',
    },
    discountedPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'discounted_percent',
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    weightUnit: {
      type: DataTypes.ENUM('G', 'KG'),
      allowNull: true,
      defaultValue: 'G',
      field: 'weight_unit',
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
