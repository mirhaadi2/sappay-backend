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
} from "./models";
import { getR2SignedUrl } from "../../uploads/r2-utils";
import { sequelize } from "../../../db/sequelize";
import { QueryTypes } from "sequelize";
import { redisClient } from "../../../config/session";
import { createHash } from "crypto";

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
        ${status !== undefined ? `WHERE "is_active" = :status` : ''}
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
    return await HomepageBanner.create({
        ...data,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
    });
};

export const updateBanner = async (
    id: string,
    data: Partial<{ text: string; isActive: boolean; order: number }>,
) => {
    const banner = await HomepageBanner.findByPk(id);
    if (!banner) throw new Error("Banner not found");
    return await banner.update(data);
};

export const deleteBanner = async (id: string) => {
    const banner = await HomepageBanner.findByPk(id);
    if (!banner) throw new Error("Banner not found");
    await banner.destroy();
};

export const getActiveHero = async (status?: boolean) => {
    try {
        const query = `
            SELECT
                id,
                title,
                subtitle,
                "video_url" AS "videoUrl",
                "video_poster_url" AS "videoPosterUrl",
                "button_text" AS "buttonText",
                "button_link" AS "buttonLink",
                "is_active" AS "isActive",
                "created_at" AS "createdAt",
                "updated_at" AS "updatedAt"
            FROM "homepage_hero"
            ${status !== undefined ? `WHERE "is_active" = :status` : ''}
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
                const videoUrl = await resolveR2Url(hero.videoUrl);
                return {
                    ...hero,
                    videoUrl,
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
    videoUrl: string;
    videoPosterUrl?: string;
    buttonText: string;
    buttonLink: string;
    isActive?: boolean;
}) => {
    if (data.isActive) {
        await HomepageHero.update(
            { isActive: false },
            { where: { isActive: true } },
        );
    }

    return await HomepageHero.create({
        ...data,
        isActive: data.isActive ?? true,
    });
};

export const updateHero = async (
    id: string,
    data: Partial<{
        title: string;
        subtitle: string;
        videoUrl: string;
        videoPosterUrl?: string;
        buttonText: string;
        buttonLink: string;
        isActive: boolean;
    }>,
) => {
    const hero = await HomepageHero.findByPk(id);
    if (!hero) throw new Error("Hero section not found");

    if (data.isActive) {
        await HomepageHero.update(
            { isActive: false },
            { where: { isActive: true } },
        );
    }

    return await hero.update(data);
};

export const deleteHero = async (id: string) => {
    const hero = await HomepageHero.findByPk(id);
    if (!hero) throw new Error("Hero section not found");
    await hero.destroy();
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
        ${status !== undefined ? `WHERE is_active = :status` : ''}
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
        WHERE is_active = true  
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
    return await HomepageSection.create({
        ...data,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
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
    const section = await HomepageSection.findByPk(id);
    if (!section) throw new Error("Section not found");
    return await section.update(data);
};

export const deleteSection = async (id: string) => {
    const section = await HomepageSection.findByPk(id);
    if (!section) throw new Error("Section not found");
    await section.destroy();
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
        ${status !== undefined ? `WHERE is_active = :status` : ''}
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
    return await Testimonial.create({
        ...data,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
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
    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) throw new Error("Testimonial not found");
    return await testimonial.update(data);
};

export const deleteTestimonial = async (id: string) => {
    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) throw new Error("Testimonial not found");
    await testimonial.destroy();
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
        ${status !== undefined ? `WHERE "is_active" = :status ` : ''}
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
    return await InstagramPost.create({
        ...data,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
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
    const post = await InstagramPost.findByPk(id);
    if (!post) throw new Error("Instagram post not found");
    return await post.update(data);
};

export const deleteInstagramPost = async (id: string) => {
    const post = await InstagramPost.findByPk(id);
    if (!post) throw new Error("Instagram post not found");
    await post.destroy();
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
    return await WebsiteSetting.create({
        ...data,
        isActive: data.isActive ?? true,
    });
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
    const setting = await WebsiteSetting.findOne({ where: { key } });
    if (!setting) throw new Error("Website setting not found");
    return await setting.update(data);
};

export const deleteWebsiteSetting = async (key: string) => {
    const setting = await WebsiteSetting.findOne({ where: { key } });
    if (!setting) throw new Error("Website setting not found");
    await setting.destroy();
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
    return await WebsitePage.create({
        ...data,
        isPublished: data.isPublished ?? false,
        order: data.order ?? 0,
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
    const page = await WebsitePage.findByPk(id);
    if (!page) throw new Error("Page not found");
    return await page.update(data);
};

export const deletePage = async (id: string) => {
    const page = await WebsitePage.findByPk(id);
    if (!page) throw new Error("Page not found");
    await page.destroy();
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
    const existingPages = await Page.findAll({ where: { type } });

    if (existingPages.length > 0) {
        const [primary, ...duplicates] = existingPages;

        // Ensure exactly one record exists per type by removing any accidental duplicates.
        if (duplicates.length > 0) {
            await Page.destroy({ where: { id: duplicates.map((page) => page.id) } });
        }

        return await primary.update({
            slug,
            ...data,
            isPublished: data.isPublished ?? false,
        });
    } else {
        return await Page.create({
            type,
            slug,
            ...data,
            isPublished: data.isPublished ?? false,
        });
    }
};

export const deletePageByType = async (type: PageType) => {
    const page = await Page.findOne({ where: { type } });
    if (page) {
        await page.destroy();
    }
};



// ===================== HOMEPAGE DATA AGGREGATOR =====================
export const getHomepageData = async () => {
    if (redisClient.isOpen) {
        try {
            const cached = await redisClient.get(HOMEPAGE_CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
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

    if (redisClient.isOpen) {
        try {
            await redisClient.set(HOMEPAGE_CACHE_KEY, JSON.stringify(result), {
                EX: HOMEPAGE_CACHE_TTL,
            });
        } catch (err: any) {
            console.warn("Redis homepage cache write failed:", err?.message || String(err));
        }
    }

    return result;
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