import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../../db/sequelize";
import { OrderItem } from "./order-item.model";

interface OrderAttributes {
  id: string;
  orderNumber?: string;
  customerId?: string;
  guestEmail?: string;
  guestPhone?: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "PACKED" // Added: Warehouse completed packing
    | "HANDOVER" // Added: Courier collected the parcel
    | "SHIPPED"
    | "OUT_FOR_DELIVERY" // Added: Last mile transition
    | "DELIVERED"
    | "DELIVERY_FAILED" // Added: Specific failure state
    | "RTO" // Added: Return to Origin
    | "CANCELLED"
    | "FAILED";
  trackingNumber?: string; // Added: AWB/Tracking ID
  statusReason?: string; // Added: Reason for FAILED/RTO/CANCELLED
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
  | "customerId"
  | "guestEmail"
  | "guestPhone"
  | "status"
  | "trackingNumber"
  | "statusReason"
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
  public customerId?: string;
  public guestEmail?: string;
  public guestPhone?: string;
  public status!:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "PACKED"
    | "HANDOVER"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY" // Added: Last mile transition
    | "DELIVERED"
    | "DELIVERY_FAILED" // Added: Failed attempt tracking
    | "RTO" // Added: Return to Origin
    | "CANCELLED"
    | "FAILED";
  public trackingNumber?: string;
  public statusReason?: string;
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
      allowNull: true,
      field: "customer_id",
    },
    guestEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "guest_email",
    },
    guestPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "guest_phone",
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",            // New: Warehouse packing done
        "HANDOVER",          // New: Courier received
        "SHIPPED",
        "OUT_FOR_DELIVERY",  // New: Last mile transit
        "DELIVERED",
        "DELIVERY_FAILED",   // New: Specific failure
        "RTO",               // New: Return to Origin
        "CANCELLED",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },
    // --- NEW LOGISTICS COLUMNS ---
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "tracking_number",
    },
    statusReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "status_reason",
    },
    // ----------------------------
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
          const lastNumericPart = parseInt(
            lastOrder.orderNumber.replace(/\D/g, ""),
            10,
          );
          nextNumber = isNaN(lastNumericPart)
            ? START_NUMBER + 1
            : lastNumericPart + 1;
        }

        order.orderNumber = `${PREFIX}${nextNumber}`;
      },
    },
  },
);

// Define associations
Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
  onDelete: "CASCADE",
});
