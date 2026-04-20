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
  // userId: string;
  businessName: string;
  businessRegistrationNo: string;
  businessType: BusinessType;
  businessIdType?: string;
  gstNumber?: string;
  businessAddress: string;
  businessPhone: string;
  ownerName: string;
  ownerEmail: string;
  password?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  commissionRate: number;
  status: SellerStatus;
  approvedAt?: Date;
  rejectedReason?: string | null;
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
  // public userId!: string;
  public businessName!: string;
  public businessRegistrationNo!: string;
  public businessType!: BusinessType;
  public businessIdType?: string;
  public gstNumber?: string;
  public businessAddress!: string;
  public businessPhone!: string;
  public ownerName!: string;
  public ownerEmail!: string;
  public password?: string;
  public bankAccountName!: string;
  public bankAccountNumber!: string;
  public bankIfscCode!: string;
  public commissionRate!: number;
  public status!: SellerStatus;
  public approvedAt?: Date;
  public rejectedReason?: string | null;
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
    // userId: {
    //   type: DataTypes.UUID,
    //   allowNull: false,
    //   unique: true,
    // },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'business_name',
    },
    businessRegistrationNo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'business_registration_no',
    },
    businessType: {
      type: DataTypes.ENUM('SOLE_PROPRIETOR', 'PARTNERSHIP', 'COMPANY', 'INDIVIDUAL'),
      allowNull: false,
      field: 'business_type',
    },
    businessIdType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'business_id_type',
    },
    gstNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'gst_number',
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'business_address',
    },
    businessPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'business_phone',
    },
    ownerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'owner_name',
    },
    ownerEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'owner_email',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true, // Changed to true to allow null values for existing records
      field: 'password',
    },
    bankAccountName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'bank_account_name',
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'bank_account_number',
    },
    bankIfscCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'bank_ifsc_code',
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.0,
      field: 'commission_rate',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    rejectedReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejected_reason',
    },
    onboardingStep: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'onboarding_step',
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'sellers',
    timestamps: true,
    paranoid: true,
  }
);

