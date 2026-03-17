import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db/sequelize';

export enum SellerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum BusinessType {
  SOLE_PROPRIETOR = 'SOLE_PROPRIETOR',
  PARTNERSHIP = 'PARTNERSHIP',
  COMPANY = 'COMPANY',
}

interface SellerAttributes {
  id: string;
  userId: string;
  businessName: string;
  businessRegistrationNo: string;
  businessType: BusinessType;
  gstNumber?: string;
  businessAddress: string;
  businessPhone: string;
  ownerName: string;
  ownerEmail: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  commissionRate: number;
  status: SellerStatus;
  approvedAt?: Date;
  rejectedReason?: string;
  onboardingStep: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type SellerCreationAttributes = Optional<
  SellerAttributes,
  'id' | 'status' | 'commissionRate' | 'onboardingStep' | 'metadata' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Seller extends Model<SellerAttributes, SellerCreationAttributes> implements SellerAttributes {
  public id!: string;
  public userId!: string;
  public businessName!: string;
  public businessRegistrationNo!: string;
  public businessType!: BusinessType;
  public gstNumber?: string;
  public businessAddress!: string;
  public businessPhone!: string;
  public ownerName!: string;
  public ownerEmail!: string;
  public bankAccountName!: string;
  public bankAccountNumber!: string;
  public bankIfscCode!: string;
  public commissionRate!: number;
  public status!: SellerStatus;
  public approvedAt?: Date;
  public rejectedReason?: string;
  public onboardingStep!: number;
  public metadata?: Record<string, any>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Seller.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    businessRegistrationNo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    businessType: {
      type: DataTypes.ENUM('SOLE_PROPRIETOR', 'PARTNERSHIP', 'COMPANY'),
      allowNull: false,
    },
    gstNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    businessPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ownerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ownerEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bankAccountName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bankIfscCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.0,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    onboardingStep: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'sellers',
    timestamps: true,
    paranoid: true,
  }
);

export default Seller;
