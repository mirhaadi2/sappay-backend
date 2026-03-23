import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

interface ProductAttributes {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  images?: string[];
  specifications?: Record<string, any>;
  basePrice?: number;
  discountedPrice?: number;
  discountedPercent?: number;
  hsn_code?: string;
  gst_rate: number;
  certifications?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  'id' | 'gst_rate' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public categoryId!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public images?: string[];
  public specifications?: Record<string, any>;
  public basePrice?: number;
  public hsn_code?: string;
  public gst_rate!: number;
  public certifications?: string[];
  public status!: 'ACTIVE' | 'INACTIVE';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'category_id',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    basePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'base_price',
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
    hsn_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18.0,
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    paranoid: true,
  }
);

// Add association with SellerProduct
// Product.hasMany(require('./seller-product.model').SellerProduct, {
//   foreignKey: 'productId',
//   as: 'sellerProducts',
// });

export default Product;
