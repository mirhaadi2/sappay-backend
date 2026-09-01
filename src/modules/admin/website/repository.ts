import { Op, QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../../../db/sequelize';
import {
    HomepageBanner,
    HomepageHero,
    HomepageSection,
    Testimonial,
    InstagramPost,
    WebsiteSetting,
    WebsitePage,
    Page,
    Promotion,
    PromotionAttributes,
} from './models';
import { Coupon, CouponAttributes } from '../../coupons/models';

export const listActiveBanners = async (status?: boolean) => {
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

    const banners = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: status !== undefined ? { status } : {},
    });

    return (banners as HomepageBanner[]) || [];
};

export const getBannerById = async (id: string, transaction?: Transaction) =>
    HomepageBanner.findByPk(id, { transaction });

export const createBannerRecord = async (
    data: { text: string; isActive?: boolean; order?: number },
    transaction?: Transaction,
) =>
    HomepageBanner.create(
        {
            ...data,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
        { transaction },
    );

export const updateBannerRecord = async (
    id: string,
    data: Partial<{ text: string; isActive: boolean; order: number }>,
    transaction?: Transaction,
) => {
    const banner = await getBannerById(id, transaction);
    if (!banner) throw new Error('Banner not found');
    return banner.update(data, { transaction });
};

export const deleteBannerRecord = async (id: string, transaction?: Transaction) => {
    const banner = await getBannerById(id, transaction);
    if (!banner) throw new Error('Banner not found');
    await banner.destroy({ transaction });
};

export const listActiveHeroes = async (status?: boolean) => {
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

    return sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: status !== undefined ? { status } : {},
    });
};

export const deactivateActiveHeroes = async (transaction?: Transaction) =>
    HomepageHero.update({ isActive: false }, { where: { isActive: true }, transaction });

export const getHeroById = async (id: string, transaction?: Transaction) =>
    HomepageHero.findByPk(id, { transaction });

export const createHeroRecord = async (
    data: {
        title: string;
        subtitle: string;
        videoUrl?: string;
        imageUrl?: string;
        backgroundImageUrl?: string;
        videoPosterUrl?: string;
        buttonText: string;
        buttonLink: string;
        isActive?: boolean;
    },
    transaction?: Transaction,
) =>
    HomepageHero.create(
        {
            ...data,
            isActive: data.isActive ?? true,
        },
        { transaction },
    );

export const updateHeroRecord = async (
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
    transaction?: Transaction,
) => {
    const hero = await getHeroById(id, transaction);
    if (!hero) throw new Error('Hero section not found');
    return hero.update(data, { transaction });
};

export const deleteHeroRecord = async (id: string, transaction?: Transaction) => {
    const hero = await getHeroById(id, transaction);
    if (!hero) throw new Error('Hero section not found');
    await hero.destroy({ transaction });
};

export const listActiveSections = async (status?: boolean) => {
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

    return sequelize.query<HomepageSection>(query, {
        type: QueryTypes.SELECT,
        replacements: status !== undefined ? { status } : {},
    });
};

export const listSectionsByType = async (sectionType: string) => {
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

    return sequelize.query<HomepageSection>(query, {
        type: QueryTypes.SELECT,
        replacements: { sectionType },
    });
};

export const getSectionById = async (id: string, transaction?: Transaction) =>
    HomepageSection.findByPk(id, { transaction });

export const createSectionRecord = async (
    data: {
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
    },
    transaction?: Transaction,
) =>
    HomepageSection.create(
        {
            ...data,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
        { transaction },
    );

export const updateSectionRecord = async (
    id: string,
    data: Partial<{
        sectionType: string;
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
    transaction?: Transaction,
) => {
    const section = await getSectionById(id, transaction);
    if (!section) throw new Error('Section not found');
    return section.update(data, { transaction });
};

export const deleteSectionRecord = async (id: string, transaction?: Transaction) => {
    const section = await getSectionById(id, transaction);
    if (!section) throw new Error('Section not found');
    await section.destroy({ transaction });
};

export const listActiveTestimonials = async (status?: boolean) => {
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

    return sequelize.query<Testimonial>(query, {
        type: QueryTypes.SELECT,
        replacements: status !== undefined ? { status } : {},
    });
};

export const getTestimonialById = async (id: string, transaction?: Transaction) =>
    Testimonial.findByPk(id, { transaction });

export const createTestimonialRecord = async (
    data: {
        author: string;
        initials: string;
        location: string;
        comment: string;
        rating: number;
        isActive?: boolean;
        order?: number;
    },
    transaction?: Transaction,
) =>
    Testimonial.create(
        {
            ...data,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
        { transaction },
    );

export const updateTestimonialRecord = async (
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
    transaction?: Transaction,
) => {
    const testimonial = await getTestimonialById(id, transaction);
    if (!testimonial) throw new Error('Testimonial not found');
    return testimonial.update(data, { transaction });
};

export const deleteTestimonialRecord = async (id: string, transaction?: Transaction) => {
    const testimonial = await getTestimonialById(id, transaction);
    if (!testimonial) throw new Error('Testimonial not found');
    await testimonial.destroy({ transaction });
};

export const listActiveInstagramPosts = async (status?: boolean) => {
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

    return sequelize.query<InstagramPost>(query, {
        type: QueryTypes.SELECT,
        replacements: status !== undefined ? { status } : {},
    });
};

export const getInstagramPostById = async (id: string, transaction?: Transaction) =>
    InstagramPost.findByPk(id, { transaction });

export const createInstagramPostRecord = async (
    data: {
        imageUrl: string;
        altText?: string;
        link?: string;
        isActive?: boolean;
        order?: number;
    },
    transaction?: Transaction,
) =>
    InstagramPost.create(
        {
            ...data,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
        { transaction },
    );

export const updateInstagramPostRecord = async (
    id: string,
    data: Partial<{
        imageUrl: string;
        altText?: string;
        link?: string;
        isActive: boolean;
        order: number;
    }>,
    transaction?: Transaction,
) => {
    const post = await getInstagramPostById(id, transaction);
    if (!post) throw new Error('Instagram post not found');
    return post.update(data, { transaction });
};

export const deleteInstagramPostRecord = async (id: string, transaction?: Transaction) => {
    const post = await getInstagramPostById(id, transaction);
    if (!post) throw new Error('Instagram post not found');
    await post.destroy({ transaction });
};

export const listWebsiteSettings = async (category?: string) => {
    const where: any = { isActive: true };
    if (category) where.category = category;

    return WebsiteSetting.findAll({
        where,
        order: [
            ['category', 'ASC'],
            ['key', 'ASC'],
        ],
    });
};

export const getWebsiteSettingByKey = async (key: string) =>
    WebsiteSetting.findOne({
        where: { key, isActive: true },
    });

export const createWebsiteSettingRecord = async (
    data: {
        key: string;
        value: string;
        type: 'string' | 'number' | 'boolean' | 'json';
        category: string;
        description?: string;
        isActive?: boolean;
    },
    transaction?: Transaction,
) =>
    WebsiteSetting.create(
        {
            ...data,
            isActive: data.isActive ?? true,
        },
        { transaction },
    );

export const updateWebsiteSettingByKey = async (
    key: string,
    data: Partial<{
        value: string;
        type: 'string' | 'number' | 'boolean' | 'json';
        category: string;
        description?: string;
        isActive: boolean;
    }>,
    transaction?: Transaction,
) => {
    const setting = await WebsiteSetting.findOne({ where: { key }, transaction });
    if (!setting) throw new Error('Website setting not found');
    return setting.update(data, { transaction });
};

export const deleteWebsiteSettingByKey = async (key: string, transaction?: Transaction) => {
    const setting = await WebsiteSetting.findOne({ where: { key }, transaction });
    if (!setting) throw new Error('Website setting not found');
    await setting.destroy({ transaction });
};

export const listPublishedPages = async () =>
    WebsitePage.findAll({
        where: { isPublished: true },
        order: [
            ['order', 'ASC'],
            ['createdAt', 'DESC'],
        ],
    });

export const listAllPages = async () =>
    WebsitePage.findAll({
        where: { deletedAt: null },
        order: [
            ['order', 'ASC'],
            ['createdAt', 'DESC'],
        ],
    });

export const getPageBySlugRecord = async (slug: string) =>
    WebsitePage.findOne({
        where: { slug, isPublished: true },
    });

export const getPageById = async (id: string, transaction?: Transaction) =>
    WebsitePage.findByPk(id, { transaction });

export const createPageRecord = async (
    data: {
        slug: string;
        title: string;
        content: string;
        metaTitle?: string;
        metaDescription?: string;
        isPublished?: boolean;
        order?: number;
    },
    transaction?: Transaction,
) =>
    WebsitePage.create(
        {
            ...data,
            isPublished: data.isPublished ?? false,
            order: data.order ?? 0,
        },
        { transaction },
    );

export const updatePageRecord = async (
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
    transaction?: Transaction,
) => {
    const page = await getPageById(id, transaction);
    if (!page) throw new Error('Page not found');
    return page.update(data, { transaction });
};

export const deletePageRecord = async (id: string, transaction?: Transaction) => {
    const page = await getPageById(id, transaction);
    if (!page) throw new Error('Page not found');
    await page.destroy({ transaction });
};

export const getPageByTypeRecord = async (type: any) =>
    Page.findOne({
        where: { type },
        order: [['createdAt', 'DESC']],
    });

export const listPagesByType = async (type: any, transaction?: Transaction) =>
    Page.findAll({ where: { type }, transaction });

export const createUnifiedPageRecord = async (
    type: any,
    slug: string,
    data: {
        title: string;
        content: string;
        metaTitle?: string;
        metaDescription?: string;
        isPublished?: boolean;
    },
    transaction?: Transaction,
) =>
    Page.create(
        {
            type,
            slug,
            ...data,
            isPublished: data.isPublished ?? false,
        },
        { transaction },
    );

export const updateUnifiedPageRecord = async (
    primaryPage: any,
    slug: string,
    data: {
        title: string;
        content: string;
        metaTitle?: string;
        metaDescription?: string;
        isPublished?: boolean;
    },
    transaction?: Transaction,
) =>
    primaryPage.update(
        {
            slug,
            ...data,
            isPublished: data.isPublished ?? false,
        },
        { transaction },
    );

export const deletePageByTypeRecord = async (type: any, transaction?: Transaction) => {
    const page = await Page.findOne({ where: { type }, transaction });
    if (page) {
        await page.destroy({ transaction });
    }
};

export const destroyDuplicatePageRecords = async (duplicates: any[], transaction?: Transaction) => {
    if (!duplicates.length) return;
    await Promise.all(duplicates.map((page) => page.destroy({ transaction })));
};

export const listActivePromotions = async () => {
    const now = new Date();
    return Promotion.findAll({
        where: {
            isActive: true,
            deletedAt: null,
            validFrom: { [Op.lte]: now },
            validUntil: { [Op.gte]: now },
        },
        order: [
            ['priority', 'DESC'],
            ['createdAt', 'DESC'],
        ],
    });
};

export const getPromotionByIdRecord = async (id: string) => Promotion.findByPk(id);

export const getApplicablePromotionsRecord = async (cartValue: number = 0) => {
    const now = new Date();
    const promotions = await Promotion.findAll({
        where: {
            isActive: true,
            validFrom: { [Op.lte]: now },
            validUntil: { [Op.gte]: now },
        },
        order: [['priority', 'DESC']],
        raw: true,
    });

    if (cartValue > 0) {
        return promotions.filter((p: any) => {
            const qualifies =
                (!p.minOrderValue || cartValue >= Number(p.minOrderValue)) &&
                (!p.maxOrderValue || cartValue <= Number(p.maxOrderValue));
            return qualifies;
        });
    }

    return promotions;
};

export const createPromotionRecord = async (
    data: Partial<PromotionAttributes>,
    transaction?: Transaction,
) => {
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Record<string, any>;

    return Promotion.create(
        {
            ...filteredData,
            currentUsage: 0,
            isActive: filteredData.isActive ?? true,
            priority: filteredData.priority ?? 0,
        } as any,
        { transaction },
    );
};

export const updatePromotionRecord = async (
    id: string,
    data: Partial<PromotionAttributes>,
    transaction?: Transaction,
) => {
    const promotion = await getPromotionByIdRecord(id);
    if (!promotion) throw new Error('Promotion not found');
    return promotion.update(data, { transaction });
};

export const deletePromotionRecord = async (id: string, transaction?: Transaction) => {
    const promotion = await getPromotionByIdRecord(id);
    if (!promotion) throw new Error('Promotion not found');
    await promotion.destroy({ transaction });
};

export const listAllPromotions = async (limit = 20, offset = 0) =>
    Promotion.findAndCountAll({
        limit,
        offset,
        order: [
            ['priority', 'DESC'],
            ['createdAt', 'DESC'],
        ],
    });

export const incrementPromotionUsageRecord = async (
    promotionId: string,
    transaction?: Transaction,
) => {
    const promotion = await getPromotionByIdRecord(promotionId);
    if (!promotion) throw new Error('Promotion not found');

    const newUsage = (promotion.currentUsage || 0) + 1;
    if (promotion.usageLimit && newUsage > promotion.usageLimit) {
        throw new Error('Promotion usage limit exceeded');
    }

    await promotion.update({ currentUsage: newUsage }, { transaction });
    return promotion;
};

export const createCouponRecord = async (
    data: Partial<CouponAttributes>,
    transaction?: Transaction,
) => {
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Record<string, any>;

    return Coupon.create(
        {
            ...filteredData,
            currentUsage: 0,
            isActive: filteredData.isActive ?? true,
            firstOrderOnly: filteredData.firstOrderOnly ?? false,
        } as any,
        { transaction },
    );
};

export const updateCouponRecord = async (
    id: string,
    data: Partial<CouponAttributes>,
    transaction?: Transaction,
) => {
    const coupon = await Coupon.findByPk(id, { transaction });
    if (!coupon) throw new Error('Coupon not found');
    return coupon.update(data, { transaction });
};

export const deleteCouponRecord = async (id: string, transaction?: Transaction) => {
    const coupon = await Coupon.findByPk(id, { transaction });
    if (!coupon) throw new Error('Coupon not found');
    await coupon.destroy({ transaction });
};

export const getCouponByIdRecord = async (id: string) => Coupon.findByPk(id);

export const getAllCoupons = async (limit = 20, offset = 0) =>
    Coupon.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
