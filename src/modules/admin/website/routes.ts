import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import {
    // Banner services
    getActiveBanners, createBanner, updateBanner, deleteBanner,
    // Hero services
    getActiveHero, createHero, updateHero, deleteHero,
    // Section services
    getActiveSections, getSectionsByType, createSection, updateSection, deleteSection,
    // Testimonial services
    getActiveTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
    // Instagram services
    getActiveInstagramPosts, createInstagramPost, updateInstagramPost, deleteInstagramPost,
    // Settings services
    getWebsiteSettings, getWebsiteSetting, createWebsiteSetting, updateWebsiteSetting, deleteWebsiteSetting,
    // Page services
    getAllPages, getPageBySlug, createPage, updatePage, deletePage,
    // Promotion services
    getActivePromotions, getApplicablePromotions, getAllPromotions, getPromotionById, createPromotion, updatePromotion, deletePromotion,
    // Coupon services
    getAllCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon,
    // Generic page service
    getPage, createOrUpdatePage, deletePageByType,
    // Data aggregators
    getHomepageData, getWebsiteData,
} from './service';

const router = Router();

/**
 * All website management routes require:
 * 1. Authentication (requireAuth)
 * 2. Active staff status (requireActiveStaff)
 * 3. Content management permission
 */

// ===================== BANNER MANAGEMENT =====================

/**
 * GET /admin/website/banners
 * Get all active banners
 */
router.get('/banners', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const banners = await getActiveBanners();
        res.json({ success: true, data: banners });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /admin/website/banners
 * Create new banner
 */
router.post('/banners', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const banner = await createBanner(req.body);
        res.json({ success: true, data: banner });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/banners/:id
 * Update banner
 */
router.put('/banners/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const banner = await updateBanner(req.params.id, req.body);
        res.json({ success: true, data: banner });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /admin/website/banners/:id
 * Delete banner
 */
router.delete('/banners/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deleteBanner(req.params.id);
        res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================== HERO SECTION MANAGEMENT =====================

/**
 * GET /admin/website/hero
 * Get active hero section
 */
router.get('/hero', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const hero = await getActiveHero();
        res.json({ success: true, data: hero });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /admin/website/hero
 * Create new hero section
 */
router.post('/hero', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const hero = await createHero(req.body);
        res.json({ success: true, data: hero });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/hero/:id
 * Update hero section
 */
router.put('/hero/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const hero = await updateHero(req.params.id, req.body);
        res.json({ success: true, data: hero });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /admin/website/hero/:id
 * Delete hero section
 */
router.delete('/hero/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deleteHero(req.params.id);
        res.json({ success: true, message: 'Hero section deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================== SECTION MANAGEMENT =====================

/**
 * GET /admin/website/sections
 * Get all active sections
 */
router.get('/sections', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const { type } = req.query;
        const sections = type ? await getSectionsByType(type as string) : await getActiveSections();
        res.json({ success: true, data: sections });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /admin/website/sections
 * Create new section
 */
router.post('/sections', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const section = await createSection(req.body);
        res.json({ success: true, data: section });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/sections/:id
 * Update section
 */
router.put('/sections/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const section = await updateSection(req.params.id, req.body);
        res.json({ success: true, data: section });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /admin/website/sections/:id
 * Delete section
 */
router.delete('/sections/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deleteSection(req.params.id);
        res.json({ success: true, message: 'Section deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================== TESTIMONIAL MANAGEMENT =====================

/**
 * GET /admin/website/testimonials
 * Get all active testimonials
 */
router.get('/testimonials', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const testimonials = await getActiveTestimonials();
        res.json({ success: true, data: testimonials });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /admin/website/testimonials
 * Create new testimonial
 */
router.post('/testimonials', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const testimonial = await createTestimonial(req.body);
        res.json({ success: true, data: testimonial });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/testimonials/:id
 * Update testimonial
 */
router.put('/testimonials/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const testimonial = await updateTestimonial(req.params.id, req.body);
        res.json({ success: true, data: testimonial });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /admin/website/testimonials/:id
 * Delete testimonial
 */
router.delete('/testimonials/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deleteTestimonial(req.params.id);
        res.json({ success: true, message: 'Testimonial deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================== INSTAGRAM POST MANAGEMENT =====================

/**
 * GET /admin/website/instagram
 * Get all active instagram posts
 */
router.get('/instagram', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const posts = await getActiveInstagramPosts();
        res.json({ success: true, data: posts });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /admin/website/instagram
 * Create new instagram post
 */
router.post('/instagram', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const post = await createInstagramPost(req.body);
        res.json({ success: true, data: post });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/instagram/:id
 * Update instagram post
 */
router.put('/instagram/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const post = await updateInstagramPost(req.params.id, req.body);
        res.json({ success: true, data: post });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /admin/website/instagram/:id
 * Delete instagram post
 */
router.delete('/instagram/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deleteInstagramPost(req.params.id);
        res.json({ success: true, message: 'Instagram post deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================== WEBSITE SETTINGS MANAGEMENT =====================

/**
 * GET /admin/website/settings
 * Get all website settings
 */
router.get('/settings', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const { category } = req.query;
        const settings = await getWebsiteSettings(category as string);
        res.json({ success: true, data: settings });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /admin/website/settings/:key
 * Get specific website setting
 */
router.get('/settings/:key', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const setting = await getWebsiteSetting(req.params.key);
        if (!setting) {
            return res.status(404).json({ success: false, error: 'Setting not found' });
        }
        res.json({ success: true, data: setting });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /admin/website/settings
 * Create new website setting
 */
router.post('/settings', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const setting = await createWebsiteSetting(req.body);
        res.json({ success: true, data: setting });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/settings/:key
 * Update website setting
 */
router.put('/settings/:key', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const setting = await updateWebsiteSetting(req.params.key, req.body);
        res.json({ success: true, data: setting });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /admin/website/settings/:key
 * Delete website setting
 */
router.delete('/settings/:key', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deleteWebsiteSetting(req.params.key);
        res.json({ success: true, message: 'Setting deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================== WEBSITE PAGES MANAGEMENT =====================

/**
 * GET /admin/website/pages
 * Get all pages
 */
router.get('/pages', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const pages = await getAllPages();
        res.json({ success: true, data: pages });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});



/**
 * POST /admin/website/pages
 * Create new page
 */
router.post('/pages', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const page = await createPage(req.body);
        res.json({ success: true, data: page });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/pages/:id
 * Update page
 */
// router.put('/pages/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
//     try {
//         const page = await updatePage(req.params.id, req.body);
//         res.json({ success: true, data: page });
//     } catch (error: any) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

/**
 * DELETE /admin/website/pages/:id
 * Delete page
 */
router.delete('/pages/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deletePage(req.params.id);
        res.json({ success: true, message: 'Page deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});


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

// ===================== PAGE MANAGEMENT (GENERIC SUPPORT PAGES) =====================
router.get('/pages/:slug', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
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

router.put('/pages/:slug', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {

        const { slug } = req.params;
        const type = getPageTypeFromSlug(slug);
        if (!type) return res.status(404).json({ success: false, error: 'Page not found' });

        const page = await createOrUpdatePage(type as any, slug, req.body);
        return res.json({ success: true, data: page });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/pages/:slug', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const { slug } = req.params;
        const type = getPageTypeFromSlug(slug);
        if (!type) return res.status(404).json({ success: false, error: 'Page not found' });

        await deletePageByType(type as any);
        return res.json({ success: true, message: 'Page deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================== WEBSITE DATA MANAGEMENT =====================

/**
 * GET /admin/website/preview
 * Get complete website data for preview
 */
router.get('/preview', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const data = await getWebsiteData();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /admin/website/homepage-preview
 * Get homepage data for preview
 */
router.get('/homepage-preview', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const data = await getHomepageData();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===================== PROMOTION/OFFER MANAGEMENT =====================

/**
 * GET /admin/website/promotions
 * Get all promotions (admin view with pagination)
 * Query params: limit, offset
 */
router.get('/promotions', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        const data = await getAllPromotions(limit, offset);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/website/promotions/active
 * Get active promotions (public endpoint for customers)
 * Query params: cartValue (optional)
 */
router.get('/promotions/active', async (req, res) => {
    try {
        const cartValue = parseFloat(req.query.cartValue as string) || 0;
        const promotions = cartValue > 0 
            ? await getApplicablePromotions(cartValue)
            : await getActivePromotions();
        res.json({ success: true, data: promotions });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /admin/website/promotions/:id
 * Get promotion by ID
 */
router.get('/promotions/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const promotion = await getPromotionById(req.params.id);
        res.json({ success: true, data: promotion });
    } catch (error: any) {
        res.status(404).json({ success: false, error: error.message });
    }
});

/**
 * POST /admin/website/promotions
 * Create new promotion
 */
router.post('/promotions', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const promotion = await createPromotion(req.body);
        res.json({ success: true, data: promotion });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/promotions/:id
 * Update promotion
 */
router.put('/promotions/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const promotion = await updatePromotion(req.params.id, req.body);
        res.json({ success: true, data: promotion });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /admin/website/promotions/:id
 * Delete promotion
 */
router.delete('/promotions/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deletePromotion(req.params.id);
        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ===================== COUPON MANAGEMENT =====================

/**
 * GET /admin/website/coupons
 * Get all coupons (admin view with pagination)
 */
router.get('/coupons', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
        const data = await getAllCoupons(limit, offset);
        res.json({ success: true, data: data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /admin/website/coupons/:id
 * Get coupon by ID
 */
router.get('/coupons/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const coupon = await getCouponById(req.params.id);
        res.json({ success: true, data: coupon });
    } catch (error: any) {
        res.status(404).json({ success: false, error: error.message });
    }
});

/**
 * POST /admin/website/coupons
 * Create new coupon
 */
router.post('/coupons', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const coupon = await createCoupon(req.body);
        res.json({ success: true, data: coupon });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * PUT /admin/website/coupons/:id
 * Update coupon
 */
router.put('/coupons/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        const coupon = await updateCoupon(req.params.id, req.body);
        res.json({ success: true, data: coupon });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /admin/website/coupons/:id
 * Delete coupon
 */
router.delete('/coupons/:id', requireAuth, requireActiveStaff, requirePermission('admin.content.write'), async (req, res) => {
    try {
        await deleteCoupon(req.params.id);
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;