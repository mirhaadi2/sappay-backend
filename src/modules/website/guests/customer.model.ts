import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';

export interface CustomerAttributes {
  id: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  name?: string | null;
  password?: string | null;
  role: 'D2C_CUSTOMER' | 'B2C_CUSTOMER';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'password'> {}

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: string;
  public email?: string;
  public phone?: string;
  public password?: string | null;
  public role!: 'D2C_CUSTOMER' | 'B2C_CUSTOMER';
  public whatsapp?: string;
  public name?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Customer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'id',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'email',
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      field: 'phone',
    },
    whatsapp: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      field: 'whatsapp',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'name',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password',
    },
    role: {
      type: DataTypes.ENUM('D2C_CUSTOMER', 'B2C_CUSTOMER'),
      allowNull: false,
      defaultValue: 'D2C_CUSTOMER',
      field: 'role',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'customers',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['whatsapp'] },
    ],
  }
);

export default Customer;
