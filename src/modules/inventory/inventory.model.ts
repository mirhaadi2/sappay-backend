import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

interface InventoryAttributes {
  id: string;
  sellerProductId: string;
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
  'id' | 'totalStock' | 'availableStock' | 'reservedStock' | 'soldStock' | 'reorderLevel' | 'createdAt' | 'updatedAt'
>;

export class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: string;
  public sellerProductId!: string;
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
      allowNull: false,
      unique: true,
    },
    totalStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    availableStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reservedStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    soldStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    lastRestockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'inventory',
    timestamps: true,
  }
);

export default Inventory;
