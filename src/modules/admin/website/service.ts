import {
    HomepageBanner,
    HomepageHero,
    HomepageSection,
    Testimonial,
    InstagramPost,
    WebsiteSetting,
    WebsitePage,
} from "./models";
import { getR2SignedUrl } from "../../uploads/r2-utils";

// ===================== BANNER SERVICES =====================
export const getActiveBanners = async () => {
    return await HomepageBanner.findAll({
        // where: { isActive: true },
        order: [
            ["order", "ASC"],
            ["createdAt", "DESC"],
        ],
    });
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

export const getActiveHero = async () => {
    try {
        const heroes = await HomepageHero.findAll({
            // where: { isActive: true },
            order: [["createdAt", "DESC"]],
            raw: true, // Recommended for read-only performance
        });

        return await Promise.all(
            heroes.map(async (hero) => {
                const videoUrl = await resolveR2Url(hero.videoUrl);
                return {
                    ...hero,
                    videoUrl,
                };
            }),
        );
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

    // If activating this hero, deactivate others
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
export const getActiveSections = async () => {
    const sections = await HomepageSection.findAll({
        // where: { isActive: true },
        raw: true,
        order: [
            ["order", "ASC"],
            ["createdAt", "DESC"],
        ],
    });

    return await Promise.all(
        sections.map(async (section) => {
            const videoUrl = await resolveR2Url(section.videoUrl);
            const imageUrl = await resolveR2Url(section.imageUrl);
            const backgroundImageUrl = await resolveR2Url(section.backgroundImageUrl);
            return {
                ...section,
                videoUrl,
                imageUrl,
                backgroundImageUrl,
            };
        }),
    );
};

export const getSectionsByType = async (sectionType: string) => {
    const sections = await HomepageSection.findAll({
        // where: { sectionType, isActive: true },
        raw: true,
        order: [
            ["order", "ASC"],
            ["createdAt", "DESC"],
        ],
    });
    return await Promise.all(
        sections.map(async (section) => {
            const videoUrl = await resolveR2Url(section.videoUrl);
            const imageUrl = await resolveR2Url(section.imageUrl);
            const backgroundImageUrl = await resolveR2Url(section.backgroundImageUrl);
            return {
                ...section,
                videoUrl,
                imageUrl,
                backgroundImageUrl,
            };
        }),
    );
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
export const getActiveTestimonials = async () => {
    return await Testimonial.findAll({
        // where: { isActive: true },
        order: [
            ["order", "ASC"],
            ["createdAt", "DESC"],
        ],
    });
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
export const getActiveInstagramPosts = async () => {
    const posts = await InstagramPost.findAll({
        // where: { isActive: true },
        raw: true,
        order: [
            ["order", "ASC"],
            ["createdAt", "DESC"],
        ],
    });

    return await Promise.all(
        posts.map(async (post) => {
            const imageUrl = await resolveR2Url(post.imageUrl);
            return {
                ...post,
                imageUrl
            };
        }),
    );
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

// ===================== HOMEPAGE DATA AGGREGATOR =====================
export const getHomepageData = async () => {
    const [banners, hero, sections, testimonials, instagramPosts] =
        await Promise.all([
            getActiveBanners(),
            getActiveHero(),
            getActiveSections(),
            getActiveTestimonials(),
            getActiveInstagramPosts(),
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