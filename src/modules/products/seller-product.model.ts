import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

interface SellerProductAttributes {
  id: string;
  sellerId: string;
  productId: string;
  sellerSku?: string;
  sellerPrice: number;
  costPrice: number;
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
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sellerSku: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sellerPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    costPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
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
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'seller_products',
    timestamps: true,
  }
);

export default SellerProduct;
