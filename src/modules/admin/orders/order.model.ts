import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../../db/sequelize";
import { OrderItem } from "./order-item.model";

interface OrderAttributes {
  id: string;
  orderNumber?: string;
  customerId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "FAILED";
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  finalAmount: number;
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod?: string;
  shippingAddressId: string;
  deliveryDate?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

type OrderCreationAttributes = Optional<
  OrderAttributes,
  | "id"
  | "status"
  | "discountAmount"
  | "taxAmount"
  | "shippingCost"
  | "paymentStatus"
  | "metadata"
  | "createdAt"
  | "updatedAt"
  | "deliveredAt"
>;

export class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: string;
  public orderNumber?: string;
  public customerId!: string;
  public status!:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "FAILED";
  public totalAmount!: number;
  public discountAmount!: number;
  public taxAmount!: number;
  public shippingCost!: number;
  public finalAmount!: number;
  public paymentStatus!: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  public paymentMethod?: string;
  public shippingAddressId!: string;
  public deliveryDate?: Date;
  public notes?: string;
  public metadata?: Record<string, any>;
  public deliveredAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: "order_number",
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "customer_id",
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "total_amount",
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "discount_amount",
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "tax_amount",
    },
    shippingCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "shipping_cost",
    },
    finalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "final_amount",
    },
    paymentStatus: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED", "REFUNDED"),
      allowNull: false,
      defaultValue: "PENDING",
      field: "payment_status",
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "payment_method",
    },
    shippingAddressId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "shipping_address_id",
    },
    deliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "delivery_date",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "delivered_at",
    },
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
    hooks: {
      beforeCreate: async (order: Order, options: any) => {
        const START_NUMBER = 1000000;
        const PREFIX = "ORD";

        // IMPORTANT: We use the transaction from 'options' to ensure data integrity
        const lastOrder = await Order.findOne({
          attributes: ["orderNumber"],
          order: [["orderNumber", "DESC"]],
          transaction: options.transaction,
          raw: true,
        });

        let nextNumber: number;

        if (!lastOrder || !lastOrder.orderNumber) {
          nextNumber = START_NUMBER + 1;
        } else {
          // Use regex to remove any non-numeric characters for safety
          const lastNumericPart = parseInt(
            lastOrder.orderNumber.replace(/\D/g, ""),
            10,
          );
          nextNumber = isNaN(lastNumericPart)
            ? START_NUMBER + 1
            : lastNumericPart + 1;
        }

        order.orderNumber = `${PREFIX}${nextNumber}`;
        console.log("Assigned order number to new order:", order);
      },
    },
  },
);

// Define associations
Order.hasMany(OrderItem, { 
  foreignKey: 'orderId', 
  as: 'items',
  onDelete: 'CASCADE'
});

OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

export default Order;
