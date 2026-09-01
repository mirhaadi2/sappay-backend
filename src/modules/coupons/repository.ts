import { Op, Transaction } from 'sequelize';
import { Order } from '../admin/orders/order.model';
import { Coupon, CouponUsage } from './models';

export const findCouponByCodeRecord = async (normalizedCode: string) => {
    return Coupon.findOne({
        where: {
            code: normalizedCode,
            isActive: true,
            validFrom: { [Op.lte]: new Date() },
            validUntil: { [Op.gte]: new Date() },
        },
    });
};

export const countCouponUsageByUserRecord = async (couponId: string, userId: string) => {
    return CouponUsage.count({
        where: { couponId, userId },
    });
};

export const countUserOrdersRecord = async (userId: string) => {
    return Order.count({
        where: { customerId: userId } as any,
    });
};

export const createCouponUsageRecord = async (
    data: {
        couponId: string;
        userId: string;
        orderId: string;
        couponCode: string;
        discountAmount: number;
        orderAmount: number;
        usedAt: Date;
    },
    transaction?: Transaction,
) => {
    return CouponUsage.create(
        {
            couponId: data.couponId,
            userId: data.userId,
            orderId: data.orderId,
            couponCode: data.couponCode,
            discountAmount: data.discountAmount,
            orderAmount: data.orderAmount,
            usedAt: data.usedAt,
        },
        { transaction },
    );
};

export const getCouponByIdRecord = async (couponId: string, transaction?: Transaction) => {
    return Coupon.findByPk(couponId, { transaction });
};

export const updateCouponUsageCountRecord = async (couponId: string, transaction?: Transaction) => {
    const coupon = await getCouponByIdRecord(couponId, transaction);
    if (!coupon) throw new Error('Coupon not found');

    await coupon.update({ currentUsage: (coupon.currentUsage || 0) + 1 }, { transaction });

    return coupon;
};
