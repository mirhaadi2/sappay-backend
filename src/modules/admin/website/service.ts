import {
    HomepageBanner,
    HomepageHero,
    HomepageSection,
    Testimonial,
    InstagramPost,
    WebsiteSetting,
    WebsitePage,
    Page,
    PageType,
    Promotion,
    PromotionType,
    PromotionAttributes,
} from './models';
import { getR2SignedUrl } from '../../uploads/r2-utils';
import { sequelize } from '../../../db/sequelize';
import { redisClient } from '../../../config/session';
import logger from '../../../utils/logger';
import { withTransaction } from '../../../utils/transaction';
import { Coupon, CouponAttributes } from '../../coupons/models';
import {
    listActiveBanners,
    createBannerRecord,
    updateBannerRecord,
    deleteBannerRecord,
    listActiveHeroes,
    deactivateActiveHeroes,
    createHeroRecord,
    updateHeroRecord,
    deleteHeroRecord,
    listActiveSections,
    listSectionsByType,
    createSectionRecord,
    updateSectionRecord,
    deleteSectionRecord,
    listActiveTestimonials,
    createTestimonialRecord,
    updateTestimonialRecord,
    deleteTestimonialRecord,
    listActiveInstagramPosts,
    createInstagramPostRecord,
    updateInstagramPostRecord,
    deleteInstagramPostRecord,
    listWebsiteSettings,
    getWebsiteSettingByKey,
    createWebsiteSettingRecord,
    updateWebsiteSettingByKey,
    deleteWebsiteSettingByKey,
    listPublishedPages,
    listAllPages,
    getPageBySlugRecord,
    getPageById,
    createPageRecord,
    updatePageRecord,
    deletePageRecord,
    getPageByTypeRecord,
    listPagesByType,
    createUnifiedPageRecord,
    updateUnifiedPageRecord,
    deletePageByTypeRecord,
    listActivePromotions,
    getPromotionByIdRecord,
    getApplicablePromotionsRecord,
    createPromotionRecord,
    updatePromotionRecord,
    deletePromotionRecord,
    listAllPromotions,
    incrementPromotionUsageRecord,
    destroyDuplicatePageRecords,
    createCouponRecord,
    updateCouponRecord,
    deleteCouponRecord,
    getCouponByIdRecord,
    getAllCoupons as getAllCouponsRecord,
} from './repository';

const HOMEPAGE_CACHE_KEY = 'website:homepage:data';
const HOMEPAGE_CACHE_TTL = 60 * 2; // 2 minutes

// ===================== BANNER SERVICES =====================
export const getActiveBanners = async (status?: boolean) => {
    try {
        return await listActiveBanners(status);
    } catch (error) {
        console.error('Error fetching active banners:', error);
        return [];
    }
};

export const createBanner = async (data: { text: string; isActive?: boolean; order?: number }) => {
    return withTransaction(async (transaction) => {
        const banner = await createBannerRecord(data, transaction);
        logger.info('Banner created in admin', { bannerId: banner.id });
        return banner;
    });
};

export const updateBanner = async (
    id: string,
    data: Partial<{ text: string; isActive: boolean; order: number }>,
) => {
    return withTransaction(async (transaction) => {
        const updated = await updateBannerRecord(id, data, transaction);
        logger.info('Banner updated in admin', { bannerId: id });
        return updated;
    });
};

export const deleteBanner = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteBannerRecord(id, transaction);
        logger.info('Banner deleted in admin', { bannerId: id });
    });
};

export const getActiveHero = async (status?: boolean) => {
    try {
        const heroes: HomepageHero[] = (await listActiveHeroes(status)) as HomepageHero[];

        const resolvedHeroes = await Promise.all(
            heroes.map(async (hero) => {
                const [videoUrl, imageUrl, backgroundImageUrl] = await Promise.all([
                    resolveR2Url(hero.videoUrl ?? null),
                    resolveR2Url(hero.imageUrl ?? null),
                    resolveR2Url(hero.backgroundImageUrl ?? null),
                ]);
                return {
                    ...hero,
                    videoUrl,
                    imageUrl,
                    backgroundImageUrl,
                };
            }),
        );

        return resolvedHeroes?.length > 0 ? resolvedHeroes : [];
    } catch (error) {
        console.error('[HeroService] Failed to fetch active heroes:', error);
        return [];
    }
};

const resolveR2Url = async (key: string | null): Promise<string> => {
    if (!key) return '';
    if (key.startsWith('http')) return key;

    try {
        return await getR2SignedUrl(key);
    } catch (err) {
        return '';
    }
};

export const createHero = async (data: {
    title: string;
    subtitle: string;
    videoUrl?: string;
    imageUrl?: string;
    backgroundImageUrl?: string;
    videoPosterUrl?: string;
    buttonText: string;
    buttonLink: string;
    isActive?: boolean;
}) => {
    return withTransaction(async (transaction) => {
        if (data.isActive) {
            await deactivateActiveHeroes(transaction);
        }

        if (!data.videoUrl && !data.imageUrl && !data.backgroundImageUrl) {
            throw new Error('Hero section must include either a video or an image.');
        }

        const hero = await createHeroRecord(data, transaction);
        logger.info('Hero created in admin', { heroId: hero.id });
        return hero;
    });
};

export const updateHero = async (
    id: string,
    data: Partial<{
        title: string;
        subtitle: string;
        videoUrl?: string;
        imageUrl?: string;
        backgroundImageUrl?: string;
        videoPosterUrl?: string;
        buttonText: string;
        buttonLink: string;
        isActive: boolean;
    }>,
) => {
    return withTransaction(async (transaction) => {
        if (data.isActive) {
            await deactivateActiveHeroes(transaction);
        }

        const updated = await updateHeroRecord(id, data, transaction);
        logger.info('Hero updated in admin', { heroId: id });
        return updated;
    });
};

export const deleteHero = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteHeroRecord(id, transaction);
        logger.info('Hero deleted in admin', { heroId: id });
    });
};

// ===================== SECTION SERVICES =====================
export const getActiveSections = async (status?: boolean) => {
    const sections = await listActiveSections(status);

    if (!sections.length) return [];

    const resolvedSections = await Promise.all(
        sections.map(async (section: any) => {
            const [videoUrl, imageUrl, backgroundImageUrl] = await Promise.all([
                resolveR2Url(section?.videoUrl),
                resolveR2Url(section?.imageUrl),
                resolveR2Url(section?.backgroundImageUrl),
            ]);

            return {
                ...section,
                videoUrl,
                imageUrl,
                backgroundImageUrl,
            };
        }),
    );

    return resolvedSections?.length > 0 ? resolvedSections : [];
};

export const getSectionsByType = async (sectionType: string) => {
    const sections = await listSectionsByType(sectionType);

    if (!sections.length) return [];

    const resolvedSections = await Promise.all(
        sections.map(async (section: any) => {
            const [videoUrl, imageUrl, backgroundImageUrl] = await Promise.all([
                resolveR2Url(section?.videoUrl),
                resolveR2Url(section?.imageUrl),
                resolveR2Url(section?.backgroundImageUrl),
            ]);

            return {
                ...section,
                videoUrl,
                imageUrl,
                backgroundImageUrl,
            };
        }),
    );

    return resolvedSections?.length > 0 ? resolvedSections : [];
};

export const createSection = async (data: {
    sectionType:
        | 'collections'
        | 'bestsellers'
        | 'health_wellness'
        | 'new_arrivals'
        | 'story'
        | 'testimonials'
        | 'instagram'
        | 'contact'
        | 'about'
        | 'footer';
    title: string;
    subtitle?: string;
    content?: string;
    imageUrl?: string;
    videoUrl?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundImageUrl?: string;
    isActive?: boolean;
    order?: number;
}) => {
    return withTransaction(async (transaction) => {
        const section = await createSectionRecord(data, transaction);
        logger.info('Section created in admin', { sectionId: section.id });
        return section;
    });
};

export const updateSection = async (
    id: string,
    data: Partial<{
        sectionType:
            | 'collections'
            | 'bestsellers'
            | 'health_wellness'
            | 'new_arrivals'
            | 'story'
            | 'testimonials'
            | 'instagram'
            | 'contact'
            | 'about'
            | 'footer';
        title: string;
        subtitle?: string;
        content?: string;
        imageUrl?: string;
        videoUrl?: string;
        buttonText?: string;
        buttonLink?: string;
        backgroundImageUrl?: string;
        isActive: boolean;
        order: number;
    }>,
) => {
    return withTransaction(async (transaction) => {
        const updated = await updateSectionRecord(id, data, transaction);
        logger.info('Section updated in admin', { sectionId: id });
        return updated;
    });
};

export const deleteSection = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteSectionRecord(id, transaction);
        logger.info('Section deleted in admin', { sectionId: id });
    });
};

// ===================== TESTIMONIAL SERVICES =====================
export const getActiveTestimonials = async (status?: boolean) => {
    return listActiveTestimonials(status);
};

export const createTestimonial = async (data: {
    author: string;
    initials: string;
    location: string;
    comment: string;
    rating: number;
    isActive?: boolean;
    order?: number;
}) => {
    return withTransaction(async (transaction) => {
        const testimonial = await createTestimonialRecord(data, transaction);
        logger.info('Testimonial created in admin', { testimonialId: testimonial.id });
        return testimonial;
    });
};

export const updateTestimonial = async (
    id: string,
    data: Partial<{
        author: string;
        initials: string;
        location: string;
        comment: string;
        rating: number;
        isActive: boolean;
        order: number;
    }>,
) => {
    return withTransaction(async (transaction) => {
        const updated = await updateTestimonialRecord(id, data, transaction);
        logger.info('Testimonial updated in admin', { testimonialId: id });
        return updated;
    });
};

export const deleteTestimonial = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteTestimonialRecord(id, transaction);
        logger.info('Testimonial deleted in admin', { testimonialId: id });
    });
};

// ===================== INSTAGRAM POST SERVICES =====================
export const getActiveInstagramPosts = async (status?: boolean) => {
    const posts: InstagramPost[] = (await listActiveInstagramPosts(status)) as InstagramPost[];

    const resolvedPosts = await Promise.all(
        posts.map(async (post) => ({
            ...post,
            imageUrl: await resolveR2Url(post.imageUrl),
        })),
    );
    return resolvedPosts;
};

export const createInstagramPost = async (data: {
    imageUrl: string;
    altText?: string;
    link?: string;
    isActive?: boolean;
    order?: number;
}) => {
    return withTransaction(async (transaction) => {
        const post = await createInstagramPostRecord(data, transaction);
        logger.info('Instagram post created in admin', { postId: post.id });
        return post;
    });
};

export const updateInstagramPost = async (
    id: string,
    data: Partial<{
        imageUrl: string;
        altText?: string;
        link?: string;
        isActive: boolean;
        order: number;
    }>,
) => {
    return withTransaction(async (transaction) => {
        const updated = await updateInstagramPostRecord(id, data, transaction);
        logger.info('Instagram post updated in admin', { postId: id });
        return updated;
    });
};

export const deleteInstagramPost = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteInstagramPostRecord(id, transaction);
        logger.info('Instagram post deleted in admin', { postId: id });
    });
};

// ===================== WEBSITE SETTINGS SERVICES =====================
export const getWebsiteSettings = async (category?: string) => {
    const settings = await listWebsiteSettings(category);

    return settings.map((setting) => ({
        ...setting.toJSON(),
        parsedValue: parseSettingValue(setting.value, setting.type),
    }));
};

export const getWebsiteSetting = async (key: string) => {
    const setting = await getWebsiteSettingByKey(key);

    if (!setting) return null;

    return {
        ...setting.toJSON(),
        parsedValue: parseSettingValue(setting.value, setting.type),
    };
};

export const createWebsiteSetting = async (data: {
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    category: string;
    description?: string;
    isActive?: boolean;
}) => {
    return withTransaction(async (transaction) => {
        const setting = await createWebsiteSettingRecord(data, transaction);
        logger.info('Website setting created', { key: data.key, category: data.category });
        return setting;
    });
};

export const updateWebsiteSetting = async (
    key: string,
    data: Partial<{
        value: string;
        type: 'string' | 'number' | 'boolean' | 'json';
        category: string;
        description?: string;
        isActive: boolean;
    }>,
) => {
    return withTransaction(async (transaction) => {
        const updated = await updateWebsiteSettingByKey(key, data, transaction);
        logger.info('Website setting updated', { key });
        return updated;
    });
};

export const deleteWebsiteSetting = async (key: string) => {
    return withTransaction(async (transaction) => {
        await deleteWebsiteSettingByKey(key, transaction);
        logger.info('Website setting deleted', { key });
    });
};

// ===================== WEBSITE PAGES SERVICES =====================
export const getPublishedPages = async () => {
    return listPublishedPages();
};

export const getAllPages = async () => {
    return listAllPages();
};

export const getPageBySlug = async (slug: string) => {
    return getPageBySlugRecord(slug);
};

export const createPage = async (data: {
    slug: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    isPublished?: boolean;
    order?: number;
}) => {
    return withTransaction(async (transaction) => {
        const page = await createPageRecord(data, transaction);
        logger.info('Website page created', { pageId: page.id, slug: data.slug });
        return page;
    });
};

export const updatePage = async (
    id: string,
    data: Partial<{
        slug: string;
        title: string;
        content: string;
        metaTitle?: string;
        metaDescription?: string;
        isPublished: boolean;
        order: number;
    }>,
) => {
    return withTransaction(async (transaction) => {
        const updated = await updatePageRecord(id, data, transaction);
        logger.info('Website page updated', { pageId: id });
        return updated;
    });
};

export const deletePage = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deletePageRecord(id, transaction);
        logger.info('Website page deleted', { pageId: id });
    });
};

// ===================== UNIFIED PAGE SERVICES =====================
export const getPage = async (type: PageType) => {
    return getPageByTypeRecord(type);
};

export const createOrUpdatePage = async (
    type: PageType,
    slug: string,
    data: {
        title: string;
        content: string;
        metaTitle?: string;
        metaDescription?: string;
        isPublished?: boolean;
    },
) => {
    return withTransaction(async (transaction) => {
        const existingPages = await listPagesByType(type, transaction);

        if (existingPages.length > 0) {
            const [primary, ...duplicates] = existingPages;

            if (duplicates.length > 0) {
                await destroyDuplicatePageRecords(duplicates, transaction);
            }

            const updated = await updateUnifiedPageRecord(primary, slug, data, transaction);

            logger.info('Unified page updated', { pageId: primary.id, type });
            return updated;
        }

        const created = await createUnifiedPageRecord(type, slug, data, transaction);
        logger.info('Unified page created', { pageId: created.id, type });
        return created;
    });
};

export const deletePageByType = async (type: PageType) => {
    return withTransaction(async (transaction) => {
        await deletePageByTypeRecord(type, transaction);
        logger.info('Unified page deleted', { type });
    });
};

// ===================== HOMEPAGE DATA AGGREGATOR =====================
export const getHomepageData = async () => {
    if (redisClient.isOpen) {
        try {
            const cached = await redisClient.get(HOMEPAGE_CACHE_KEY);
            if (cached) {
                const rawData = JSON.parse(cached);
                // Resolve image URLs on every request to prevent expiry
                return await resolveHomepageUrls(rawData);
            }
        } catch (err: any) {
            console.warn('Redis homepage cache read failed:', err?.message || String(err));
        }
    }

    const [banners, hero, sections, testimonials, instagramPosts] = await Promise.all([
        getActiveBanners(true),
        getActiveHero(true),
        getActiveSections(true),
        getActiveTestimonials(true),
        getActiveInstagramPosts(true),
    ]);

    const result = {
        banners,
        hero,
        sections,
        testimonials,
        instagramPosts,
    };

    // Cache raw data without resolved URLs
    if (redisClient.isOpen) {
        try {
            const cachePayload = {
                banners, // No images
                hero: hero.map((h) => ({
                    ...h,
                    videoUrl: h.videoUrl?.replace(/^https?:\/\//, ''),
                    imageUrl: h.imageUrl?.replace(/^https?:\/\//, ''),
                    backgroundImageUrl: h.backgroundImageUrl?.replace(/^https?:\/\//, ''),
                })), // Store raw keys
                sections: sections.map((s) => ({
                    ...s,
                    imageUrl: s.imageUrl?.replace(/^https?:\/\//, ''),
                    videoUrl: s.videoUrl?.replace(/^https?:\/\//, ''),
                    backgroundImageUrl: s.backgroundImageUrl?.replace(/^https?:\/\//, ''),
                })), // Store raw keys
                testimonials, // No images
                instagramPosts: instagramPosts.map((p) => ({
                    ...p,
                    imageUrl: p.imageUrl?.replace(/^https?:\/\//, ''),
                })), // Store raw keys
            };
            await redisClient.set(HOMEPAGE_CACHE_KEY, JSON.stringify(cachePayload), {
                EX: HOMEPAGE_CACHE_TTL,
            });
        } catch (err: any) {
            console.warn('Redis homepage cache write failed:', err?.message || String(err));
        }
    }

    return result;
};

// Helper to resolve URLs from cached raw data
const resolveHomepageUrls = async (rawData: any) => {
    const [banners, hero, sections, testimonials, instagramPosts] = await Promise.all([
        Promise.all(
            rawData.banners.map(async (b: any) => ({
                ...b,
                imageUrl: await resolveR2Url(b.imageUrl),
            })),
        ),
        Promise.all(
            rawData.hero.map(async (h: any) => ({
                ...h,
                videoUrl: await resolveR2Url(h.videoUrl),
                imageUrl: await resolveR2Url(h.imageUrl),
                backgroundImageUrl: await resolveR2Url(h.backgroundImageUrl),
            })),
        ),
        Promise.all(
            rawData.sections.map(async (s: any) => ({
                ...s,
                imageUrl: await resolveR2Url(s.imageUrl),
                videoUrl: await resolveR2Url(s.videoUrl),
                backgroundImageUrl: await resolveR2Url(s.backgroundImageUrl),
            })),
        ),
        rawData.testimonials,
        Promise.all(
            rawData.instagramPosts.map(async (p: any) => ({
                ...p,
                imageUrl: await resolveR2Url(p.imageUrl),
            })),
        ),
    ]);

    return {
        banners,
        hero,
        sections,
        testimonials,
        instagramPosts,
    };
};

// ===================== WEBSITE DATA AGGREGATOR =====================
export const getWebsiteData = async () => {
    const [homepageData, settings, pages] = await Promise.all([
        getHomepageData(),
        getWebsiteSettings(),
        getPublishedPages(),
    ]);

    return {
        homepage: homepageData,
        settings,
        pages,
    };
};

// ===================== PROMOTION/OFFER SERVICES =====================
/**
 * Get all active promotions
 * Used by customers to see current available offers
 */
export const getActivePromotions = async () => {
    return listActivePromotions();
};

/**
 * Get promotion by ID with full details
 */
export const getPromotionById = async (id: string) => {
    const promotion = await getPromotionByIdRecord(id);
    if (!promotion) throw new Error('Promotion not found');
    return promotion;
};

/**
 * Get promotions applicable for a specific cart value
 * Used by checkout page to display relevant promotions
 */
export const getApplicablePromotions = async (cartValue: number = 0) => {
    return getApplicablePromotionsRecord(cartValue);
};

/**
 * Create new promotion
 */
export const createPromotion = async (data: Partial<PromotionAttributes>) => {
    return withTransaction(async (transaction) => {
        const promotion = await createPromotionRecord(data, transaction);
        logger.info('Promotion created in admin', { promotionId: promotion.id });
        return promotion;
    });
};

/**
 * Update promotion
 */
export const updatePromotion = async (id: string, data: Partial<PromotionAttributes>) => {
    return withTransaction(async (transaction) => {
        const updated = await updatePromotionRecord(id, data, transaction);
        logger.info('Promotion updated in admin', { promotionId: id });
        return updated;
    });
};

/**
 * Delete promotion (soft delete)
 */
export const deletePromotion = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deletePromotionRecord(id, transaction);
        logger.info('Promotion deleted in admin', { promotionId: id });
    });
};

/**
 * Get all promotions (admin view with pagination)
 */
export const getAllPromotions = async (limit = 20, offset = 0) => {
    const { count, rows } = await listAllPromotions(limit, offset);

    return {
        total: count,
        data: rows,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
    };
};

/**
 * Increment promotion usage
 * Called when a customer qualifies for the promotion
 */
export const incrementPromotionUsage = async (promotionId: string) => {
    return withTransaction(async (transaction) => {
        const promotion = await incrementPromotionUsageRecord(promotionId, transaction);
        logger.info('Promotion usage incremented', { promotionId });
        return promotion;
    });
};

// ===================== COUPON SERVICES =====================

/**
 * Create coupon (admin)
 */
export const createCoupon = async (data: Partial<CouponAttributes>) => {
    return withTransaction(async (transaction) => {
        const coupon = await createCouponRecord(data, transaction);
        logger.info('Coupon created in admin', { couponId: coupon.id, code: coupon.code });
        return coupon;
    });
};

/**
 * Update coupon (admin)
 */
export const updateCoupon = async (id: string, data: Partial<CouponAttributes>) => {
    return withTransaction(async (transaction) => {
        const updated = await updateCouponRecord(id, data, transaction);
        logger.info('Coupon updated in admin', { couponId: id });
        return updated;
    });
};

/**
 * Delete coupon (soft delete)
 */
export const deleteCoupon = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteCouponRecord(id, transaction);
        logger.info('Coupon deleted in admin', { couponId: id });
    });
};

/**
 * Get coupon by ID (admin)
 */
export const getCouponById = async (id: string) => {
    const coupon = await getCouponByIdRecord(id);
    if (!coupon) throw new Error('Coupon not found');
    return coupon;
};

/**
 * Get all coupons (admin view with pagination)
 */
export const getAllCoupons = async (limit = 20, offset = 0) => {
    const { count, rows } = await getAllCouponsRecord(limit, offset);

    return {
        total: count,
        data: rows,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
    };
};

// ===================== HELPER FUNCTIONS =====================
function parseSettingValue(value: string, type: 'string' | 'number' | 'boolean' | 'json') {
    switch (type) {
        case 'number':
            return parseFloat(value);
        case 'boolean':
            return value.toLowerCase() === 'true';
        case 'json':
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        default:
            return value;
    }
}
