import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

interface CategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategoryId?: string;
  image?: string;
  isActive: boolean;
  displayOrder: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

type CategoryCreationAttributes = Optional<
  CategoryAttributes,
  'id' | 'isActive' | 'displayOrder' | 'metadata' | 'createdAt' | 'updatedAt'
>;

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public parentCategoryId?: string;
  public image?: string;
  public isActive!: boolean;
  public displayOrder!: number;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parentCategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_category_id'
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order',
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
    tableName: 'categories',
    timestamps: true,
  }
);

export default Category;
