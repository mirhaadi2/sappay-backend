import { Router } from 'express';
import { getHomepageData, getAboutUs, getShippingPolicy, getReturnsRefunds, getFAQs } from '../../admin/website/service';

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
        const [aboutUs, shipping, returns, faqs] = await Promise.all([
            getAboutUs(),
            getShippingPolicy(),
            getReturnsRefunds(),
            getFAQs(),
        ]);
        const pages = [];
        if (aboutUs?.isPublished) pages.push({ ...aboutUs.toJSON(), slug: 'about' });
        if (shipping?.isPublished) pages.push({ ...shipping.toJSON(), slug: 'shipping' });
        if (returns?.isPublished) pages.push({ ...returns.toJSON(), slug: 'returns' });
        if (faqs?.isPublished) pages.push({ ...faqs.toJSON(), slug: 'faqs' });
        res.json({ success: true, data: pages });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch pages' });
    }
});

/**
 * GET /api/homepage/pages/:slug
 * Get a published page by slug (public)
 */
router.get('/pages/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        let page = null;
        switch (slug) {
            case 'about':
                page = await getAboutUs();
                break;
            case 'shipping':
                page = await getShippingPolicy();
                break;
            case 'returns':
                page = await getReturnsRefunds();
                break;
            case 'faqs':
            case 'faq':
                page = await getFAQs();
                break;
            default:
                return res.status(404).json({ success: false, error: 'Page not found' });
        }
        if (!page || !page.isPublished) {
            return res.status(404).json({ success: false, error: 'Page not found' });
        }
        res.json({ success: true, data: { ...page.toJSON(), slug } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch page' });
    }
});

export default router;