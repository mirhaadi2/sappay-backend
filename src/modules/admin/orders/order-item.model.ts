import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';

interface OrderItemAttributes {
  id: string;
  orderId: string;
  productId: string;
  productVariantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxAmount?: number;
  itemTotal?: number;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  trackerNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

type OrderItemCreationAttributes = Optional<
  OrderItemAttributes,
  'id' | 'status' | 'taxAmount' | 'metadata' | 'createdAt' | 'updatedAt'
>;

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: string;
  public orderId!: string;
  public productId!: string;
  public productVariantId!: string;
  public sku!: string;
  public quantity!: number;
  public unitPrice!: number;
  public subtotal!: number;
  public taxAmount?: number;
  public itemTotal?: number;
  public status!: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  public trackerNumber?: string;
  public shippedAt?: Date;
  public deliveredAt?: Date;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
    },
    productVariantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_variant_id',
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'unit_price',
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'subtotal',
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'tax_amount',
    },
    itemTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'item_total',                  
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'CONFIRMED',
        'PACKED',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'RETURNED'
      ),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    trackerNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'tracker_number',
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'shipped_at',
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'delivered_at',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
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
    tableName: 'order_items',
    timestamps: true,
  }
);

export default OrderItem;
