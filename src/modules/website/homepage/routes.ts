import { Router } from 'express';
import { getHomepageData } from '../../admin/website/service';

const router = Router();

/**
 * GET /api/homepage
 * Get all homepage data for the website
 */
router.get('/', async (req, res) => {
    try {
        const data = await getHomepageData();
        res.json({
            success: true,
            data
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch homepage data'
        });
    }
});

export default router;