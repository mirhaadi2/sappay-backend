import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../../db/sequelize";
import { User } from "../customers/models";

export enum AddressType {
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}

interface AddressAttributes {
  id: string;
  userId?: string;
  customerId?: string;
  type: AddressType;
  name?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type AddressCreationAttributes = Optional<
  AddressAttributes,
  "id" | "type" | "isDefault" | "createdAt" | "updatedAt"
>;

export class Address extends Model<AddressAttributes, AddressCreationAttributes> implements AddressAttributes {
  public id!: string;
  public userId?: string;
  public customerId?: string;
  public type!: AddressType;
  public name?: string;
  public addressLine1!: string;
  public addressLine2?: string;
  public city!: string;
  public state!: string;
  public postalCode!: string;
  public country!: string;
  public phone!: string;
  public isDefault!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Address.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(AddressType)),
      allowNull: false,
      defaultValue: AddressType.HOME,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "addresses",
    timestamps: true,
    underscored: true,
    paranoid: false,
  }
);

// Define association
User.hasMany(Address, {
  foreignKey: "userId",
  as: "addresses",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Address.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

export default Address;
