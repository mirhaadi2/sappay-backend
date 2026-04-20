import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../../db/sequelize";
import { Customer } from "../guests/customer.model";
import { Order } from "../../admin/orders/order.model";
import { OrderItem } from "../../admin/orders/order-item.model";

interface ReviewAttributes {
  id: string;
  customerId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  rating: number; // 1-5 stars
  comment?: string;
  isVerified: boolean; // Whether the customer actually purchased this product
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type ReviewCreationAttributes = Optional<
  ReviewAttributes,
  "id" | "comment" | "isVerified" | "createdAt" | "updatedAt" | "deletedAt"
>;

export class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes {
  public id!: string;
  public customerId!: string;
  public orderId!: string;
  public orderItemId!: string;
  public productId!: string;
  public rating!: number;
  public comment?: string;
  public isVerified!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "customer_id",
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "order_id",
    },
    orderItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "order_item_id",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "product_id",
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_verified",
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
    }
  },
  {
    sequelize,
    tableName: "reviews",
    timestamps: true,
    indexes: [
      { fields: ["customer_id"] },
      { fields: ["order_id"] },
      { fields: ["order_item_id"] },
      { fields: ["product_id"] },
      { fields: ["seller_product_id"] },
      { fields: ["rating"] },
      { fields: ["created_at"] },
    ],
  },
);

Customer.hasMany(Review, {
  foreignKey: 'customerId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

Review.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
  onDelete: "CASCADE",
});

Order.hasMany(Review, {
  foreignKey: "orderId",
  as: "reviews",
  onDelete: "CASCADE",
});

Review.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
  onDelete: "CASCADE",
});

OrderItem.hasOne(Review, {
  foreignKey: "orderItemId",
  as: "review",
  onDelete: "CASCADE",
});

Review.belongsTo(OrderItem, {
  foreignKey: "orderItemId",
  as: "orderItem",
  onDelete: "CASCADE",
});