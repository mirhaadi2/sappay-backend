import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';

interface InventoryAttributes {
  id: string;
  sellerProductId?: string;
  productId?: string;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  reorderLevel: number;
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type InventoryCreationAttributes = Optional<
  InventoryAttributes,
  'id' | 'totalStock' | 'sellerProductId' | 'productId' | 'availableStock' | 'reservedStock' | 'soldStock' | 'reorderLevel' | 'createdAt' | 'updatedAt'
>;

export class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: string;
  public sellerProductId?: string;
  public productId?: string;
  public totalStock!: number;
  public availableStock!: number;
  public reservedStock!: number;
  public soldStock!: number;
  public reorderLevel!: number;
  public lastRestockedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Inventory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    sellerProductId: {
      type: DataTypes.UUID,
      allowNull: true,
      // unique: true,
      field: 'seller_product_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      // unique: true,
      field: 'product_id',
    },
    totalStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_stock',
    },
    availableStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'available_stock',
    },
    reservedStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'reserved_stock',
    },
    soldStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sold_stock',
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'reorder_level',
    },
    lastRestockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_restocked_at',
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
    tableName: 'inventory',
    timestamps: true,
  }
);

export default Inventory;
