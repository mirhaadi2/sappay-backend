import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import Product from './product.model';

interface SellerProductAttributes {
  id: string;
  sellerId: string;
  productId: string;
  sellerSku?: string;
  sellerPrice: number;
  costPrice: number;
  discountedPrice?: number;
  discountedPercent?: number;
  rating?: number;
  ratingCount?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  warrantyMonths?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  createdAt: Date;
  updatedAt: Date;
}

type SellerProductCreationAttributes = Optional<
  SellerProductAttributes,
  'id' | 'status' | 'createdAt' | 'updatedAt'
>;

export class SellerProduct extends Model<SellerProductAttributes, SellerProductCreationAttributes>
  implements SellerProductAttributes {
  public id!: string;
  public sellerId!: string;
  public productId!: string;
  public sellerSku?: string;
  public sellerPrice!: number;
  public costPrice!: number;
  public discountedPrice?: number;
  public discountedPercent?: number;
  public rating?: number;
  public ratingCount?: number;
  public weight?: number;
  public dimensions?: Record<string, any>;
  public warrantyMonths?: number;
  public status!: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SellerProduct.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'seller_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id'
    },
    sellerSku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'seller_sku',
    },
    sellerPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'seller_price',
    },
    costPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'cost_price',
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
      validate: {
        min: 0,
        max: 100,
      },
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'rating_count',
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    warrantyMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'warranty_months',
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'DISCONTINUED'),
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
    tableName: 'seller_products',
    timestamps: true,
  }
);

// Add association with Product
// SellerProduct.belongsTo(Product, {
//   foreignKey: 'productId',
//   as: 'product',
// });

export default SellerProduct;
