import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../../db/sequelize';

interface InventoryHistoryAttributes {
  id: string;
  inventoryId: string;
  sellerProductId?: string;
  productId?: string;
  type: 'STOCK_ADDED' | 'STOCK_REMOVED' | 'ORDER_PLACED' | 'ORDER_COMPLETED' | 'STOCK_RETURNED' | 'STOCK_RESERVED' | 'RESERVED_RELEASED' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string; // orderId, adjustmentId, etc.
  notes?: string;
  createdAt: Date;
  addedBy?: string; // userId of the person/system that made the change
}

type InventoryHistoryCreationAttributes = Optional<
  InventoryHistoryAttributes,
  'id' | 'createdAt' | 'addedBy'| 'sellerProductId' | 'productId'
>;

export class InventoryHistory extends Model<InventoryHistoryAttributes, InventoryHistoryCreationAttributes>
  implements InventoryHistoryAttributes {
  public id!: string;
  public inventoryId!: string;
  public sellerProductId?: string;
  public productId?: string;
  public type!: 'STOCK_ADDED' | 'STOCK_REMOVED' | 'ORDER_PLACED' | 'ORDER_COMPLETED' | 'STOCK_RETURNED' | 'STOCK_RESERVED' | 'RESERVED_RELEASED' | 'ADJUSTMENT';
  public quantity!: number;
  public previousStock!: number;
  public newStock!: number;
  public reference?: string;
  public notes?: string;
  public addedBy?: string;
  public readonly createdAt!: Date;
}

InventoryHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    inventoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'inventory_id',
    },
    sellerProductId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'seller_product_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'product_id',
    },
    addedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'added_by',
    },
    type: {
      type: DataTypes.ENUM('STOCK_ADDED', 'STOCK_REMOVED', 'ORDER_PLACED', 'ORDER_COMPLETED', 'STOCK_RETURNED', 'STOCK_RESERVED', 'RESERVED_RELEASED', 'ADJUSTMENT'),
      allowNull: false,
      defaultValue: 'STOCK_ADDED',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'previous_stock',
    },
    newStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'new_stock',
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'inventory_history',
    timestamps: false,
  }
);

export default InventoryHistory;
