import { Router } from 'express';
import {
    getAllPages,
    getHomepageData,
    getPage,
} from '../../admin/website/service';

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

/**
 * GET /api/homepage/pages
 * Get all published support pages (public)
 */
router.get('/pages', async (req, res) => {
    try {
        const pages = await getAllPages();
        res.json({ success: true, data: pages });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch pages' });
    }
});

/**
 * GET /api/homepage/pages/:slug
 * Get a published page by slug (public)
 */
const supportSlugToTypeMap: Record<string, any> = {
    'about-us': 'about_us',
    'shipping-policy': 'shipping_policy',
    'returns-refunds': 'returns_refunds',
    'faqs': 'faqs',
    'privacy-policy': 'privacy_policy',
    'terms-and-conditions': 'terms_conditions',
    'sitemap': 'sitemap',
};

const getPageTypeFromSlug = (slug: string) => {
    return supportSlugToTypeMap[slug];
};

router.get('/pages/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const type = getPageTypeFromSlug(slug);
        if (!type) return res.status(404).json({ success: false, error: 'Page not found' });

        const page = await getPage(type as any);
        if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

        return res.json({ success: true, data: page });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;