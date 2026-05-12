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
} from "./models";
import { getR2SignedUrl } from "../../uploads/r2-utils";
import { sequelize } from "../../../db/sequelize";
import { Op, QueryTypes } from "sequelize";
import { redisClient } from "../../../config/session";
import { createHash } from "crypto";
import logger from "../../../utils/logger";
import { withTransaction } from "../../../utils/transaction";

const HOMEPAGE_CACHE_KEY = "website:homepage:data";
const HOMEPAGE_CACHE_TTL = 60 * 2; // 2 minutes

// ===================== BANNER SERVICES =====================
export const getActiveBanners = async (status?: boolean) => {
    const query = `
        SELECT 
            id, 
            text, 
            "is_active" AS "isActive", 
            "order", 
            "created_at" AS "createdAt", 
            "updated_at" AS "updatedAt"
        FROM "homepage_banners"
        WHERE "deleted_at" IS NULL
        ${status !== undefined ? `AND "is_active" = :status` : ''}
        ORDER BY "created_at" DESC
    `;

    let banners: HomepageBanner[] = [];
    try {
        banners = await sequelize.query(query, { 
            type: QueryTypes.SELECT,
            replacements: status !== undefined ? { status } : {},
            logging(sql, timing) {
                console.log(`[SQL - ${timing}ms]: ${sql}`);
            },
            benchmark: true,
        });
    } catch (error) {
        console.error("Error fetching active banners:", error);
        return [];
    }

    return banners as HomepageBanner[] || [];
};

export const createBanner = async (data: {
    text: string;
    isActive?: boolean;
    order?: number;
}) => {
    return withTransaction(async (transaction) => {
        const banner = await HomepageBanner.create(
            {
                ...data,
                isActive: data.isActive ?? true,
                order: data.order ?? 0,
            },
            { transaction }
        );
        logger.info('Banner created in admin', { bannerId: banner.id });
        return banner;
    });
};

export const updateBanner = async (
    id: string,
    data: Partial<{ text: string; isActive: boolean; order: number }>,
) => {
    return withTransaction(async (transaction) => {
        const banner = await HomepageBanner.findByPk(id, { transaction });
        if (!banner) throw new Error("Banner not found");
        const updated = await banner.update(data, { transaction });
        logger.info('Banner updated in admin', { bannerId: id });
        return updated;
    });
};

export const deleteBanner = async (id: string) => {
    return withTransaction(async (transaction) => {
        const banner = await HomepageBanner.findByPk(id, { transaction });
        if (!banner) throw new Error("Banner not found");
        await banner.destroy({ transaction });
        logger.info('Banner deleted in admin', { bannerId: id });
    });
};

export const getActiveHero = async (status?: boolean) => {
    try {
        const query = `
            SELECT
                id,
                title,
                subtitle,
                "video_url" AS "videoUrl",
                "image_url" AS "imageUrl",
                "background_image_url" AS "backgroundImageUrl",
                "video_poster_url" AS "videoPosterUrl",
                "button_text" AS "buttonText",
                "button_link" AS "buttonLink",
                "is_active" AS "isActive",
                "created_at" AS "createdAt",
                "updated_at" AS "updatedAt"
            FROM "homepage_hero"
            WHERE "deleted_at" IS NULL
            ${status !== undefined ? `AND "is_active" = :status` : ''}
            ORDER BY "created_at" DESC
        `;

        const heroes: HomepageHero[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: status !== undefined ? { status } : {},
            logging(sql, timing) {
                console.log(`[SQL - ${timing}ms]: ${sql}`);
            },
            benchmark: true,
        });

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
        console.error("[HeroService] Failed to fetch active heroes:", error);
        return [];
    }
};

const resolveR2Url = async (key: string | null): Promise<string> => {
    if (!key) return "";
    if (key.startsWith("http")) return key;

    try {
        return await getR2SignedUrl(key);
    } catch (err) {
        return "";
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
            await HomepageHero.update(
                { isActive: false },
                { where: { isActive: true }, transaction },
            );
        }

        if (!data.videoUrl && !data.imageUrl && !data.backgroundImageUrl) {
            throw new Error('Hero section must include either a video or an image.');
        }

        const hero = await HomepageHero.create(
            {
                ...data,
                isActive: data.isActive ?? true,
            },
            { transaction }
        );
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
        const hero = await HomepageHero.findByPk(id, { transaction });
        if (!hero) throw new Error("Hero section not found");

        if (data.isActive) {
            await HomepageHero.update(
                { isActive: false },
                { where: { isActive: true }, transaction },
            );
        }

        const updated = await hero.update(data, { transaction });
        logger.info('Hero updated in admin', { heroId: id });
        return updated;
    });
};

export const deleteHero = async (id: string) => {
    return withTransaction(async (transaction) => {
        const hero = await HomepageHero.findByPk(id, { transaction });
        if (!hero) throw new Error("Hero section not found");
        await hero.destroy({ transaction });
        logger.info('Hero deleted in admin', { heroId: id });
    });
};

// ===================== SECTION SERVICES =====================
export const getActiveSections = async (status?: boolean) => {
    const query = `
        SELECT
            id,
            section_type AS "sectionType",
            title,
            subtitle,
            content,
            image_url AS "imageUrl",
            video_url AS "videoUrl",
            button_text AS "buttonText",
            button_link AS "buttonLink",
            background_image_url AS "backgroundImageUrl",
            is_active AS "isActive",
            "order",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        FROM homepage_sections
        WHERE deleted_at IS NULL
        ${status !== undefined ? `AND is_active = :status` : ''}
        ORDER BY "order" ASC, created_at DESC
    `;

    const sections = await sequelize.query<HomepageSection>(query, {
        type: QueryTypes.SELECT,
        replacements: status !== undefined ? { status } : {},
        benchmark: true,
        logging: (sql, timing) => console.log(`[SQL - ${timing}ms]: ${sql}`),
    });

    if (!sections.length) return [];

    const resolvedSections = await Promise.all(
        sections.map(async (section: any) => {
            const [videoUrl, imageUrl, backgroundImageUrl] = await Promise.all([
                resolveR2Url(section?.videoUrl),
                resolveR2Url(section?.imageUrl),
                resolveR2Url(section?.backgroundImageUrl)
            ]);

            return {
                ...section,
                videoUrl,
                imageUrl,
                backgroundImageUrl,
            };
        })
    );

    return resolvedSections?.length > 0 ? resolvedSections : [];
};

export const getSectionsByType = async (sectionType: string) => {
    const query = `
        SELECT
            id,
            section_type AS "sectionType",
            title,
            subtitle,
            content,
            image_url AS "imageUrl",
            video_url AS "videoUrl",
            button_text AS "buttonText",
            button_link AS "buttonLink",
            background_image_url AS "backgroundImageUrl",
            is_active AS "isActive",
            "order",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        FROM homepage_sections
        WHERE is_active = true AND deleted_at IS NULL 
        AND section_type = :sectionType
        ORDER BY "order" ASC, created_at DESC
    `;

    const sections = await sequelize.query<HomepageSection>(query, {
        type: QueryTypes.SELECT,
        replacements: { sectionType },
        benchmark: true,
        logging: (sql, timing) => console.log(`[SQL - ${timing}ms]: ${sql}`),
    });

    if (!sections.length) return [];

    const resolvedSections = await Promise.all(
        sections.map(async (section: any) => {
            const [videoUrl, imageUrl, backgroundImageUrl] = await Promise.all([
                resolveR2Url(section?.videoUrl),
                resolveR2Url(section?.imageUrl),
                resolveR2Url(section?.backgroundImageUrl)
            ]);

            return {
                ...section,
                videoUrl,
                imageUrl,
                backgroundImageUrl,
            };
        })
    );

    return resolvedSections?.length > 0 ? resolvedSections : [];
};

export const createSection = async (data: {
    sectionType:
        | "collections"
        | "bestsellers"
        | "health_wellness"
        | "new_arrivals"
        | "story"
        | "testimonials"
        | "instagram"
        | "contact"
        | "about"
        | "footer";
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
        const section = await HomepageSection.create(
            {
                ...data,
                isActive: data.isActive ?? true,
                order: data.order ?? 0,
            },
            { transaction }
        );
        logger.info('Section created in admin', { sectionId: section.id });
        return section;
    });
};

export const updateSection = async (
    id: string,
    data: Partial<{
        sectionType:
        | "collections"
        | "bestsellers"
        | "health_wellness"
        | "new_arrivals"
        | "story"
        | "testimonials"
        | "instagram"
        | "contact"
        | "about"
        | "footer";
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
        const section = await HomepageSection.findByPk(id, { transaction });
        if (!section) throw new Error("Section not found");
        const updated = await section.update(data, { transaction });
        logger.info('Section updated in admin', { sectionId: id });
        return updated;
    });
};

export const deleteSection = async (id: string) => {
    return withTransaction(async (transaction) => {
        const section = await HomepageSection.findByPk(id, { transaction });
        if (!section) throw new Error("Section not found");
        await section.destroy({ transaction });
        logger.info('Section deleted in admin', { sectionId: id });
    });
};

// ===================== TESTIMONIAL SERVICES =====================
export const getActiveTestimonials = async (status?: boolean) => {
    const query = `
        SELECT
            id,
            author,
            initials,
            location,
            comment,
            rating,
            is_active AS "isActive",
            "order",
            "created_at" AS "createdAt",
            "updated_at" AS "updatedAt"
        FROM testimonials
        WHERE deleted_at IS NULL
        ${status !== undefined ? `AND is_active = :status` : ''}
        ORDER BY "order" ASC, created_at DESC
    `;

    const testimonials: Testimonial[] = await sequelize.query<Testimonial>(query, {
        type: QueryTypes.SELECT,
        replacements: status !== undefined ? { status } : {},
        benchmark: true,
        logging: (sql, timing) => console.log(`[SQL - ${timing}ms]: ${sql}`),
    });

    return testimonials;
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
    const transaction = await sequelize.transaction();
    try {
        const testimonial = await Testimonial.create(
            {
                ...data,
                isActive: data.isActive ?? true,
                order: data.order ?? 0,
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Testimonial created in admin', { testimonialId: testimonial.id });
        return testimonial;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating testimonial in admin', { error });
        throw error;
    }
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
    const transaction = await sequelize.transaction();
    try {
        const testimonial = await Testimonial.findByPk(id, { transaction });
        if (!testimonial) throw new Error("Testimonial not found");
        const updated = await testimonial.update(data, { transaction });
        await transaction.commit();
        logger.info('Testimonial updated in admin', { testimonialId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating testimonial in admin', { testimonialId: id, error });
        throw error;
    }
};

export const deleteTestimonial = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const testimonial = await Testimonial.findByPk(id, { transaction });
        if (!testimonial) throw new Error("Testimonial not found");
        await testimonial.destroy({ transaction });
        await transaction.commit();
        logger.info('Testimonial deleted in admin', { testimonialId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting testimonial in admin', { testimonialId: id, error });
        throw error;
    }
};

// ===================== INSTAGRAM POST SERVICES =====================
export const getActiveInstagramPosts = async (status?: boolean) => {
    const query = `
        SELECT
            "id",
            "image_url" AS "imageUrl",
            "alt_text"  AS "altText",
            "link",
            "is_active" AS "isActive",
            "order",
            "created_at" AS "createdAt"
        FROM "instagram_posts"
        WHERE deleted_at IS NULL
        ${status !== undefined ? `AND "is_active" = :status` : ''}
        ORDER BY "created_at" DESC
    `;

    const posts: InstagramPost[] = await sequelize.query<InstagramPost>(query, {
        type: QueryTypes.SELECT,
        replacements: status !== undefined ? { status } : {},
        benchmark: true,
        logging: (sql, timing) => console.log(`[SQL - ${timing}ms]: ${sql}`),
    });

    const resolvedPosts = await Promise.all(
        posts.map(async (post) => ({
            ...post,
            imageUrl: await resolveR2Url(post.imageUrl)
        }))
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
    const transaction = await sequelize.transaction();
    try {
        const post = await InstagramPost.create(
            {
                ...data,
                isActive: data.isActive ?? true,
                order: data.order ?? 0,
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Instagram post created in admin', { postId: post.id });
        return post;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating Instagram post in admin', { error });
        throw error;
    }
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
    const transaction = await sequelize.transaction();
    try {
        const post = await InstagramPost.findByPk(id, { transaction });
        if (!post) throw new Error("Instagram post not found");
        const updated = await post.update(data, { transaction });
        await transaction.commit();
        logger.info('Instagram post updated in admin', { postId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating Instagram post in admin', { postId: id, error });
        throw error;
    }
};

export const deleteInstagramPost = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const post = await InstagramPost.findByPk(id, { transaction });
        if (!post) throw new Error("Instagram post not found");
        await post.destroy({ transaction });
        await transaction.commit();
        logger.info('Instagram post deleted in admin', { postId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting Instagram post in admin', { postId: id, error });
        throw error;
    }
};

// ===================== WEBSITE SETTINGS SERVICES =====================
export const getWebsiteSettings = async (category?: string) => {
    const where: any = { isActive: true };
    if (category) where.category = category;

    const settings = await WebsiteSetting.findAll({
        where,
        order: [
            ["category", "ASC"],
            ["key", "ASC"],
        ],
    });

    // Parse values based on type
    return settings.map((setting) => ({
        ...setting.toJSON(),
        parsedValue: parseSettingValue(setting.value, setting.type),
    }));
};

export const getWebsiteSetting = async (key: string) => {
    const setting = await WebsiteSetting.findOne({
        where: { key, isActive: true },
    });

    if (!setting) return null;

    return {
        ...setting.toJSON(),
        parsedValue: parseSettingValue(setting.value, setting.type),
    };
};

export const createWebsiteSetting = async (data: {
    key: string;
    value: string;
    type: "string" | "number" | "boolean" | "json";
    category: string;
    description?: string;
    isActive?: boolean;
}) => {
    const transaction = await sequelize.transaction();
    try {
        const setting = await WebsiteSetting.create(
            {
                ...data,
                isActive: data.isActive ?? true,
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Website setting created', { key: data.key, category: data.category });
        return setting;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating website setting', { key: data.key, error });
        throw error;
    }
};

export const updateWebsiteSetting = async (
    key: string,
    data: Partial<{
        value: string;
        type: "string" | "number" | "boolean" | "json";
        category: string;
        description?: string;
        isActive: boolean;
    }>,
) => {
    const transaction = await sequelize.transaction();
    try {
        const setting = await WebsiteSetting.findOne({ where: { key }, transaction });
        if (!setting) throw new Error("Website setting not found");
        const updated = await setting.update(data, { transaction });
        await transaction.commit();
        logger.info('Website setting updated', { key });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating website setting', { key, error });
        throw error;
    }
};

export const deleteWebsiteSetting = async (key: string) => {
    const transaction = await sequelize.transaction();
    try {
        const setting = await WebsiteSetting.findOne({ where: { key }, transaction });
        if (!setting) throw new Error("Website setting not found");
        await setting.destroy({ transaction });
        await transaction.commit();
        logger.info('Website setting deleted', { key });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting website setting', { key, error });
        throw error;
    }
};

// ===================== WEBSITE PAGES SERVICES =====================
export const getPublishedPages = async () => {
    return await WebsitePage.findAll({
        where: { isPublished: true },
        order: [
            ["order", "ASC"],
            ["createdAt", "DESC"],
        ],
    });
};

export const getAllPages = async () => {
    return await WebsitePage.findAll({
        where: { deletedAt: null },
        order: [
            ["order", "ASC"],
            ["createdAt", "DESC"],
        ],
    });
};

export const getPageBySlug = async (slug: string) => {
    return await WebsitePage.findOne({
        where: { slug, isPublished: true },
    });
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
    const transaction = await sequelize.transaction();
    try {
        const page = await WebsitePage.create(
            {
                ...data,
                isPublished: data.isPublished ?? false,
                order: data.order ?? 0,
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Website page created', { pageId: page.id, slug: data.slug });
        return page;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating website page', { slug: data.slug, error });
        throw error;
    }
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
    const transaction = await sequelize.transaction();
    try {
        const page = await WebsitePage.findByPk(id, { transaction });
        if (!page) throw new Error("Page not found");
        const updated = await page.update(data, { transaction });
        await transaction.commit();
        logger.info('Website page updated', { pageId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating website page', { pageId: id, error });
        throw error;
    }
};

export const deletePage = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const page = await WebsitePage.findByPk(id, { transaction });
        if (!page) throw new Error("Page not found");
        await page.destroy({ transaction });
        await transaction.commit();
        logger.info('Website page deleted', { pageId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting website page', { pageId: id, error });
        throw error;
    }
};

// ===================== UNIFIED PAGE SERVICES =====================
export const getPage = async (type: PageType) => {
    return await Page.findOne({
        where: { type },
        order: [["createdAt", "DESC"]],
    });
};

export const createOrUpdatePage = async (type: PageType, slug: string, data: {
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    isPublished?: boolean;
}) => {
    const transaction = await sequelize.transaction();
    try {
        const existingPages = await Page.findAll({ where: { type }, transaction });

        if (existingPages.length > 0) {
            const [primary, ...duplicates] = existingPages;

            // Ensure exactly one record exists per type by removing any accidental duplicates.
            if (duplicates.length > 0) {
                await Page.destroy({ 
                    where: { id: duplicates.map((page) => page.id) },
                    transaction 
                });
            }

            const updated = await primary.update({
                slug,
                ...data,
                isPublished: data.isPublished ?? false,
            }, { transaction });
            
            await transaction.commit();
            logger.info('Unified page updated', { pageId: primary.id, type });
            return updated;
        } else {
            const created = await Page.create({
                type,
                slug,
                ...data,
                isPublished: data.isPublished ?? false,
            }, { transaction });
            
            await transaction.commit();
            logger.info('Unified page created', { pageId: created.id, type });
            return created;
        }
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating/updating unified page', { type, error });
        throw error;
    }
};

export const deletePageByType = async (type: PageType) => {
    const transaction = await sequelize.transaction();
    try {
        const page = await Page.findOne({ where: { type }, transaction });
        if (page) {
            await page.destroy({ transaction });
        }
        await transaction.commit();
        logger.info('Unified page deleted', { type });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting unified page', { type, error });
        throw error;
    }
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
            console.warn("Redis homepage cache read failed:", err?.message || String(err));
        }
    }

    const [banners, hero, sections, testimonials, instagramPosts] =
        await Promise.all([
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
                hero: hero.map(h => ({
                    ...h,
                    videoUrl: h.videoUrl?.replace(/^https?:\/\//, ''),
                    imageUrl: h.imageUrl?.replace(/^https?:\/\//, ''),
                    backgroundImageUrl: h.backgroundImageUrl?.replace(/^https?:\/\//, ''),
                })), // Store raw keys
                sections: sections.map(s => ({
                    ...s,
                    imageUrl: s.imageUrl?.replace(/^https?:\/\//, ''),
                    videoUrl: s.videoUrl?.replace(/^https?:\/\//, ''),
                    backgroundImageUrl: s.backgroundImageUrl?.replace(/^https?:\/\//, '')
                })), // Store raw keys
                testimonials, // No images
                instagramPosts: instagramPosts.map(p => ({ ...p, imageUrl: p.imageUrl?.replace(/^https?:\/\//, '') })), // Store raw keys
            };
            await redisClient.set(HOMEPAGE_CACHE_KEY, JSON.stringify(cachePayload), {
                EX: HOMEPAGE_CACHE_TTL,
            });
        } catch (err: any) {
            console.warn("Redis homepage cache write failed:", err?.message || String(err));
        }
    }

    return result;
};

// Helper to resolve URLs from cached raw data
const resolveHomepageUrls = async (rawData: any) => {
    const [banners, hero, sections, testimonials, instagramPosts] = await Promise.all([
        Promise.all(rawData.banners.map(async (b: any) => ({
            ...b,
            imageUrl: await resolveR2Url(b.imageUrl)
        }))),
        Promise.all(rawData.hero.map(async (h: any) => ({
            ...h,
            videoUrl: await resolveR2Url(h.videoUrl),
            imageUrl: await resolveR2Url(h.imageUrl),
            backgroundImageUrl: await resolveR2Url(h.backgroundImageUrl),
        }))),
        Promise.all(rawData.sections.map(async (s: any) => ({
            ...s,
            imageUrl: await resolveR2Url(s.imageUrl),
            videoUrl: await resolveR2Url(s.videoUrl),
            backgroundImageUrl: await resolveR2Url(s.backgroundImageUrl),
        }))),
        rawData.testimonials,
        Promise.all(rawData.instagramPosts.map(async (p: any) => ({
            ...p,
            imageUrl: await resolveR2Url(p.imageUrl)
        }))),
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
    const now = new Date();
    const promotions = await Promotion.findAll({
        where: {
            isActive: true,
            deletedAt: null,
            validFrom: { [Op.lte]: now },
            validUntil: { [Op.gte]: now },
        },
        order: [['priority', 'DESC'], ['createdAt', 'DESC']],
        logging: (sql, timing) => {
            console.log(`[SQL - ${timing}ms]: ${sql}`);
        },
    });
    return promotions;
};

/**
 * Get promotion by ID with full details
 */
export const getPromotionById = async (id: string) => {
    const promotion = await Promotion.findByPk(id);
    if (!promotion) throw new Error('Promotion not found');
    return promotion;
};

/**
 * Get promotions applicable for a specific cart value
 * Used by checkout page to display relevant promotions
 */
export const getApplicablePromotions = async (cartValue: number = 0) => {
    const now = new Date();
    const promotions = await Promotion.findAll({
        where: {
            isActive: true,
            displayOnCheckout: true,
            validFrom: { [Op.lte]: now },
            validUntil: { [Op.gte]: now },
        },
        order: [['priority', 'DESC']],
        raw: true,
    });

    // Filter by cart value if provided
    if (cartValue > 0) {
        return promotions.filter(p => {
            const qualifies = 
                (!p.minOrderValue || cartValue >= Number(p.minOrderValue)) &&
                (!p.maxOrderValue || cartValue <= Number(p.maxOrderValue));
            return qualifies;
        });
    }

    return promotions;
};

/**
 * Create new promotion
 */
export const createPromotion = async (data: Partial<PromotionAttributes>) => {
    const transaction = await sequelize.transaction();
    try {
        // Filter out undefined properties and cast to ensure type safety
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined)
        ) as Record<string, any>;

        const promotion = await Promotion.create(
            {
                ...filteredData,
                currentUsage: 0,
                isActive: filteredData.isActive ?? true,
                displayOnHomepage: filteredData.displayOnHomepage ?? true,
                displayOnCheckout: filteredData.displayOnCheckout ?? true,
                priority: filteredData.priority ?? 0,
            } as any,
            { transaction }
        );
        await transaction.commit();
        logger.info('Promotion created in admin', { promotionId: promotion.id });
        return promotion;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating promotion', { error });
        throw error;
    }
};

/**
 * Update promotion
 */
export const updatePromotion = async (
    id: string,
    data: Partial<PromotionAttributes>
) => {
    const transaction = await sequelize.transaction();
    try {
        const promotion = await Promotion.findByPk(id, { transaction });
        if (!promotion) throw new Error('Promotion not found');
        
        const updated = await promotion.update(data, { transaction });
        await transaction.commit();
        logger.info('Promotion updated in admin', { promotionId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating promotion', { promotionId: id, error });
        throw error;
    }
};

/**
 * Delete promotion (soft delete)
 */
export const deletePromotion = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const promotion = await Promotion.findByPk(id, { transaction });
        if (!promotion) throw new Error('Promotion not found');
        
        await promotion.destroy({ transaction });
        await transaction.commit();
        logger.info('Promotion deleted in admin', { promotionId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting promotion', { promotionId: id, error });
        throw error;
    }
};

/**
 * Get all promotions (admin view with pagination)
 */
export const getAllPromotions = async (limit = 20, offset = 0) => {
    const { count, rows } = await Promotion.findAndCountAll({
        limit,
        offset,
        order: [['priority', 'DESC'], ['createdAt', 'DESC']],
    });
    
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
    const transaction = await sequelize.transaction();
    try {
        const promotion = await Promotion.findByPk(promotionId, { transaction });
        if (!promotion) throw new Error('Promotion not found');
        
        const newUsage = (promotion.currentUsage || 0) + 1;
        
        // Check if usage limit exceeded
        if (promotion.usageLimit && newUsage > promotion.usageLimit) {
            throw new Error('Promotion usage limit exceeded');
        }
        
        await promotion.update({ currentUsage: newUsage }, { transaction });
        await transaction.commit();
        
        return promotion;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error incrementing promotion usage', { promotionId, error });
        throw error;
    }
};

// ===================== HELPER FUNCTIONS =====================
function parseSettingValue(
    value: string,
    type: "string" | "number" | "boolean" | "json",
) {
    switch (type) {
        case "number":
            return parseFloat(value);
        case "boolean":
            return value.toLowerCase() === "true";
        case "json":
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        default:
            return value;
    }
}