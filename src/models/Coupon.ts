import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';

export enum CouponType {
    FIXED_DISCOUNT = 'fixed_discount',
    PERCENTAGE_DISCOUNT = 'percentage_discount',
    FREE_SHIPPING = 'free_shipping',
    FREE_ORDER = 'free_order'
}

export interface CouponAttributes {
    id: string;
    code: string;
    title: string;
    description?: string;
    type: CouponType;
    discountValue?: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    validFrom: Date;
    validUntil: Date;
    usageLimit?: number;
    currentUsage: number;
    perUserLimit?: number;
    applicableCategories?: string[];
    applicableProducts?: string[];
    excludeProducts?: string[];
    firstOrderOnly: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export type CouponCreationAttributes = Optional<
    CouponAttributes,
    | 'id'
    | 'description'
    | 'discountValue'
    | 'minOrderValue'
    | 'maxDiscountAmount'
    | 'usageLimit'
    | 'currentUsage'
    | 'perUserLimit'
    | 'applicableCategories'
    | 'applicableProducts'
    | 'excludeProducts'
    | 'firstOrderOnly'
    | 'isActive'
    | 'deletedAt'
>;

export class Coupon extends Model<CouponAttributes, CouponCreationAttributes> implements CouponAttributes {
    public id!: string;
    public code!: string;
    public title!: string;
    public description?: string;
    public type!: CouponType;
    public discountValue?: number;
    public minOrderValue?: number;
    public maxDiscountAmount?: number;
    public validFrom!: Date;
    public validUntil!: Date;
    public usageLimit?: number;
    public currentUsage!: number;
    public perUserLimit?: number;
    public applicableCategories?: string[];
    public applicableProducts?: string[];
    public excludeProducts?: string[];
    public firstOrderOnly!: boolean;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date | null;
}

Coupon.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        type: { type: DataTypes.ENUM(...Object.values(CouponType)), allowNull: false },
        discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'discount_value' },
        minOrderValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'min_order_value' },
        maxDiscountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'max_discount_amount' },
        validFrom: { type: DataTypes.DATE, allowNull: false, field: 'valid_from' },
        validUntil: { type: DataTypes.DATE, allowNull: false, field: 'valid_until' },
        usageLimit: { type: DataTypes.INTEGER, allowNull: true, field: 'usage_limit' },
        currentUsage: { type: DataTypes.INTEGER, defaultValue: 0, field: 'current_usage' },
        perUserLimit: { type: DataTypes.INTEGER, allowNull: true, field: 'per_user_limit' },
        applicableCategories: { type: DataTypes.JSON, allowNull: true, defaultValue: null, field: 'applicable_categories' },
        applicableProducts: { type: DataTypes.JSON, allowNull: true, defaultValue: null, field: 'applicable_products' },
        excludeProducts: { type: DataTypes.JSON, allowNull: true, defaultValue: null, field: 'exclude_products' },
        firstOrderOnly: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'first_order_only' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    {
        sequelize,
        tableName: 'coupons',
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['code'] },
            { fields: ['is_active'] },
            { fields: ['valid_from', 'valid_until'] },
            { fields: ['type'] },
        ],
    }
);

// export default Coupon;
