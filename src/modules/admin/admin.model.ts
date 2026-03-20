import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

interface AdminAttributes {
  id: string;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type AdminCreationAttributes = Optional<AdminAttributes, 'id' | 'name' | 'phone' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public name?: string;
  public phone?: string;
  public status!: 'active' | 'inactive' | 'suspended';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Admin.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
  },
  { sequelize, tableName: 'admins', timestamps: true, paranoid: true, underscored: true }
);
