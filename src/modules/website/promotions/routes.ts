import { Router } from 'express';
import { getActivePromotions, getApplicablePromotions } from '../../admin/website/service';

const router = Router();

/**
 * GET /api/website/promotions/active
 * Get active promotions (public endpoint for customers)
 * Query params:
 *   - cartValue: optional number for filtering applicable promotions
 */
router.get('/active', async (req, res) => {
    try {
        const cartValue = req.query.cartValue ? parseFloat(req.query.cartValue as string) : 0;
        
        const promotions = cartValue > 0 
            ? await getApplicablePromotions(cartValue)
            : await getActivePromotions();
        
        res.json({ success: true, data: promotions });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to fetch promotions' 
        });
    }
});

export default router;
