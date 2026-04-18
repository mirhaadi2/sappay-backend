import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';

interface ProductAttributes {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  // descriptionDetails?: Array<{
  //   type: 'text' | 'highlight' | 'point';
  //   content: string;
  // }>;
  images?: string[];
  specifications?: Record<string, any>;
  benefits?: string[];
  ingredients?: string[];
  nutritionFacts?: Array<{
    label: string;
    value: string;
  }>;
  weight?: number;
  hsn_code?: string;
  gst_rate: number;
  certifications?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  isNew: boolean;
  isCustomerFavourites: boolean;
  isBestseller: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type ProductCreationAttributes = Optional<
  ProductAttributes,
  'id' | 'gst_rate' | 'status' | 'isNew' | 'isCustomerFavourites' | 'isBestseller' | 'benefits' | 'ingredients' | 'nutritionFacts' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public categoryId!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public descriptionDetails?: Array<{
    type: 'text' | 'highlight' | 'point';
    content: string;
  }>;
  public images?: string[];
  public specifications?: Record<string, any>;
  public benefits?: string[];
  public ingredients?: string[];
  public nutritionFacts?: Array<{
    label: string;
    value: string;
  }>;
  public hsn_code?: string;
  public weight?: number;
  public gst_rate!: number;
  public certifications?: string[];
  public status!: 'ACTIVE' | 'INACTIVE';
  public isNew!: boolean;
  public isCustomerFavourites!: boolean;
  public isBestseller!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'category_id',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    // descriptionDetails: {
    //   type: DataTypes.JSON,
    //   allowNull: true,
    //   defaultValue: [],
    //   field: 'description_details',
    // },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    benefits: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    ingredients: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    nutritionFacts: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      field: 'nutrition_facts',
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    hsn_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18.0,
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_new',
    },
    isCustomerFavourites: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_customer_favourites',
    },
    isBestseller: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_best_seller',
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    paranoid: true,
  }
);

// Add association with SellerProduct
// Product.hasMany(require('./seller-product.model').SellerProduct, {
//   foreignKey: 'productId',
//   as: 'sellerProducts',
// });

export default Product;
