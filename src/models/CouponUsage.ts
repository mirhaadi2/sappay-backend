import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { Coupon } from './Coupon';

export interface CouponUsageAttributes {
    id: string;
    couponId: string;
    userId: string;
    orderId: string;
    couponCode: string;
    discountAmount: number;
    orderAmount: number;
    usedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type CouponUsageCreationAttributes = Optional<CouponUsageAttributes, 'id' | 'createdAt' | 'updatedAt' | 'usedAt'>;

export class CouponUsage extends Model<CouponUsageAttributes, CouponUsageCreationAttributes> implements CouponUsageAttributes {
    public id!: string;
    public couponId!: string;
    public userId!: string;
    public orderId!: string;
    public couponCode!: string;
    public discountAmount!: number;
    public orderAmount!: number;
    public usedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

CouponUsage.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        couponId: { type: DataTypes.UUID, allowNull: false, field: 'coupon_id' },
        userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
        orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
        couponCode: { type: DataTypes.STRING(100), allowNull: true, field: 'coupon_code' },
        discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'discount_amount' },
        orderAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'order_amount' },
        usedAt: { type: DataTypes.DATE, allowNull: false, field: 'used_at' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
    },
    {
        sequelize,
        tableName: 'coupon_usages',
        timestamps: true,
        underscored: true,
        paranoid: false,
        indexes: [
            { fields: ['coupon_id'] },
            { fields: ['user_id'] },
            { fields: ['order_id'] },
            { fields: ['coupon_id', 'user_id'] },
            { fields: ['coupon_code'] },
        ],
    }
);

Coupon.hasMany(CouponUsage, { foreignKey: 'couponId', as: 'usages' });
CouponUsage.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });

// export default CouponUsage;
