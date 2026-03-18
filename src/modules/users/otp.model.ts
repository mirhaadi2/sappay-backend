import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../../db/sequelize";

export enum OtpType {
  REGISTRATION = "registration",
  LOGIN = "login",
  RESET_PASSWORD = "reset_password",
}

interface OtpAttributes {
  id: string;
  email: string;
  code: string;
  type: OtpType;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type OtpCreationAttributes = Optional<
  OtpAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export class Otp extends Model<OtpAttributes, OtpCreationAttributes> implements OtpAttributes {
  public id!: string;
  public email!: string;
  public code!: string;
  public type!: OtpType;
  public expiresAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Otp.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(OtpType)),
      allowNull: false,
      defaultValue: OtpType.REGISTRATION,
    },
    expiresAt: {
      type: DataTypes.DATE,
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
    tableName: "otps",
    timestamps: true,
    underscored: true,
  }
);