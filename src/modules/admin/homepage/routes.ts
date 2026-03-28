import { Router } from 'express';
import { requireAuth, requireActiveStaff, requirePermission } from '../middleware';
import {
    getActiveBanners, createBanner, updateBanner, deleteBanner,
    getActiveHero, createHero, updateHero, deleteHero,
    getActiveSections, getSectionsByType, createSection, updateSection, deleteSection,
    getActiveTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
    getActiveInstagramPosts, createInstagramPost, updateInstagramPost, deleteInstagramPost,
    getHomepageData
} from '../../website/homepage/service';

const router = Router();

/**
 * All homepage management routes require:
 * 1. Authentication (requireAuth)
 * 2. Active staff status (requireActiveStaff)
 * 3. Content management permission
 */

// ===================== BANNER MANAGEMENT =====================

/**
 * GET /admin/homepage/banners
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
 * POST /admin/homepage/banners
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
 * PUT /admin/homepage/banners/:id
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
 * DELETE /admin/homepage/banners/:id
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
 * GET /admin/homepage/hero
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
 * POST /admin/homepage/hero
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
 * PUT /admin/homepage/hero/:id
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
 * DELETE /admin/homepage/hero/:id
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
 * GET /admin/homepage/sections
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
 * POST /admin/homepage/sections
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
 * PUT /admin/homepage/sections/:id
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
 * DELETE /admin/homepage/sections/:id
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
 * GET /admin/homepage/testimonials
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
 * POST /admin/homepage/testimonials
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
 * PUT /admin/homepage/testimonials/:id
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
 * DELETE /admin/homepage/testimonials/:id
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
 * GET /admin/homepage/instagram
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
 * POST /admin/homepage/instagram
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
 * PUT /admin/homepage/instagram/:id
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
 * DELETE /admin/homepage/instagram/:id
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

// ===================== HOMEPAGE PREVIEW =====================

/**
 * GET /admin/homepage/preview
 * Get complete homepage data for preview
 */
router.get('/preview', requireAuth, requireActiveStaff, requirePermission('admin.content.read'), async (req, res) => {
    try {
        const data = await getHomepageData();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;