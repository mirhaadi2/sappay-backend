import { Router } from 'express';
import { validateCoupon, applyCoupon, recordCouponUsage } from '../../coupons/service';

const router = Router();

// POST /api/website/coupons/validate
router.post('/validate', async (req, res) => {
    try {
        const { couponCode, userId, cartItems, subtotal } = req.body;
        const result = await validateCoupon(
            couponCode,
            userId || null,
            cartItems || [],
            Number(subtotal || 0),
        );
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/website/coupons/apply
router.post('/apply', async (req, res) => {
    try {
        const { couponCode, subtotal } = req.body;
        // validate first
        const validation = await validateCoupon(couponCode, null, [], Number(subtotal || 0));
        if (!validation.valid || !validation.coupon)
            return res.status(400).json({ success: false, message: validation.message });

        const applied = await applyCoupon(validation.coupon, Number(subtotal || 0));
        res.json({ success: true, data: applied });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export { router as couponsRoutes };
