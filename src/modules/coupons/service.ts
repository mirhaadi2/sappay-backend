import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../db/sequelize';
import { Order } from '../admin/orders/order.model';
import { Coupon } from '../../models/Coupon';
import { CouponUsage } from '../../models/CouponUsage';

interface ValidateResult {
  valid: boolean;
  coupon: Coupon | null;
  discountAmount: number;
  message?: string;
}

export const validateCoupon = async (
  couponCode: string,
  userId: string | null,
  cartItems: Array<{ productId: string; categoryId?: string; quantity: number; price: number }>,
  subtotal: number,
): Promise<ValidateResult> => {
  const normalized = couponCode?.trim().toUpperCase();
  if (!normalized) return { valid: false, coupon: null, discountAmount: 0, message: 'Invalid code' };

  const now = new Date();
  const coupon = await Coupon.findOne({
    where: {
      code: normalized,
      isActive: true,
      validFrom: { [Op.lte]: now },
      validUntil: { [Op.gte]: now },
    },
  });

  if (!coupon) return { valid: false, coupon: null, discountAmount: 0, message: 'Coupon not found or inactive' };

  // usage limit
  if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) {
    return { valid: false, coupon, discountAmount: 0, message: 'Coupon usage limit exceeded' };
  }

  // per user limit
  if (userId && coupon.perUserLimit) {
    const usedByUser = await CouponUsage.count({ where: { couponId: coupon.id, userId } });
    if (usedByUser >= coupon.perUserLimit) {
      return { valid: false, coupon, discountAmount: 0, message: 'Per-user limit exceeded' };
    }
  }

  // first order only
  if (coupon.firstOrderOnly && userId) {
    const userOrders = await Order.count({ where: { customerId: userId } as any });
    if (userOrders > 0) {
      return { valid: false, coupon, discountAmount: 0, message: 'Coupon valid only for first order' };
    }
  }

  // min order value
  if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
    return { valid: false, coupon, discountAmount: 0, message: 'Minimum order value not met' };
  }

  // exclude products
  const productIds = cartItems.map((i) => i.productId);
  if (coupon.excludeProducts && coupon.excludeProducts.length > 0) {
    const excluded = productIds.filter((p) => (coupon.excludeProducts || []).includes(p));
    if (excluded.length > 0) return { valid: false, coupon, discountAmount: 0, message: 'Cart contains excluded products' };
  }

  // applicable products/categories - require at least one match if specified
  if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
    const matched = productIds.some((p) => (coupon.applicableProducts || []).includes(p));
    if (!matched) return { valid: false, coupon, discountAmount: 0, message: 'No applicable products in cart' };
  }

  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const categoryIds = cartItems.map((i) => i.categoryId).filter(Boolean) as string[];
    const matched = categoryIds.some((c) => (coupon.applicableCategories || []).includes(c));
    if (!matched) return { valid: false, coupon, discountAmount: 0, message: 'No applicable categories in cart' };
  }

  // If passed all checks, compute discount
  const applyResult = await applyCoupon(coupon, subtotal);

  return { valid: true, coupon, discountAmount: applyResult.discountAmount };
};

export const applyCoupon = async (coupon: Coupon, subtotal: number) => {
  let discountAmount = 0;
  switch (coupon.type) {
    case 'fixed_discount':
      discountAmount = Number(coupon.discountValue || 0);
      if (discountAmount > subtotal) discountAmount = subtotal;
      break;
    case 'percentage_discount':
      discountAmount = (Number(coupon.discountValue || 0) / 100) * subtotal;
      if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
      break;
    case 'free_shipping':
      // free shipping handled separately by checkout (return 0 here)
      discountAmount = 0;
      break;
    default:
      discountAmount = 0;
  }

  return {
    couponId: coupon.id,
    couponCode: coupon.code,
    couponType: coupon.type,
    discountAmount,
  };
};

export const recordCouponUsage = async (
  couponId: string,
  userId: string,
  orderId: string,
  couponCode: string,
  discountAmount: number,
  orderAmount: number,
) => {
  const t = await sequelize.transaction();
  try {
    await CouponUsage.create(
      {
        couponId,
        userId,
        orderId,
        couponCode,
        discountAmount,
        orderAmount,
        usedAt: new Date(),
      },
      { transaction: t },
    );

    // increment coupon usage
    const coupon = await Coupon.findByPk(couponId, { transaction: t });
    if (!coupon) throw new Error('Coupon not found');
    await coupon.update({ currentUsage: (coupon.currentUsage || 0) + 1 }, { transaction: t });

    await t.commit();
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};
