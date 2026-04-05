import { HomepageBanner, HomepageHero, HomepageSection, Testimonial, InstagramPost } from './models';
import { sequelize } from '../../../db/sequelize';
import logger from '../../../utils/logger';

// ===================== BANNER SERVICES =====================
export const getActiveBanners = async () => {
    return await HomepageBanner.findAll({
        where: { isActive: true },
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
};

export const createBanner = async (data: { text: string; isActive?: boolean; order?: number }) => {
    const transaction = await sequelize.transaction();
    try {
        const banner = await HomepageBanner.create(
            {
                ...data,
                isActive: data.isActive ?? true,
                order: data.order ?? 0
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Banner created', { bannerId: banner.id });
        return banner;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating banner', { error });
        throw error;
    }
};

export const updateBanner = async (id: string, data: Partial<{ text: string; isActive: boolean; order: number }>) => {
    const transaction = await sequelize.transaction();
    try {
        const banner = await HomepageBanner.findByPk(id, { transaction });
        if (!banner) throw new Error('Banner not found');
        const updated = await banner.update(data, { transaction });
        await transaction.commit();
        logger.info('Banner updated', { bannerId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating banner', { bannerId: id, error });
        throw error;
    }
};

export const deleteBanner = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const banner = await HomepageBanner.findByPk(id, { transaction });
        if (!banner) throw new Error('Banner not found');
        await banner.destroy({ transaction });
        await transaction.commit();
        logger.info('Banner deleted', { bannerId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting banner', { bannerId: id, error });
        throw error;
    }
};

// ===================== HERO SECTION SERVICES =====================
export const getActiveHero = async () => {
    return await HomepageHero.findOne({
        where: { isActive: true },
        order: [['createdAt', 'DESC']]
    });
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
    const transaction = await sequelize.transaction();
    try {
        // Deactivate other heroes if this one is active
        if (data.isActive) {
            await HomepageHero.update(
                { isActive: false },
                { where: { isActive: true }, transaction }
            );
        }
        const hero = await HomepageHero.create(
            {
                ...data,
                isActive: data.isActive ?? true
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Hero created', { heroId: hero.id });
        return hero;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating hero', { error });
        throw error;
    }
};

export const updateHero = async (id: string, data: Partial<{
    title: string;
    subtitle: string;
    videoUrl: string;
    videoPosterUrl?: string;
    buttonText: string;
    buttonLink: string;
    isActive: boolean;
}>) => {
    const transaction = await sequelize.transaction();
    try {
        const hero = await HomepageHero.findByPk(id, { transaction });
        if (!hero) throw new Error('Hero section not found');

        // If activating this hero, deactivate others
        if (data.isActive) {
            await HomepageHero.update(
                { isActive: false },
                { where: { isActive: true }, transaction }
            );
        }

        const updated = await hero.update(data, { transaction });
        await transaction.commit();
        logger.info('Hero updated', { heroId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating hero', { heroId: id, error });
        throw error;
    }
};

export const deleteHero = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const hero = await HomepageHero.findByPk(id, { transaction });
        if (!hero) throw new Error('Hero section not found');
        await hero.destroy({ transaction });
        await transaction.commit();
        logger.info('Hero deleted', { heroId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting hero', { heroId: id, error });
        throw error;
    }
};

// ===================== SECTION SERVICES =====================
export const getActiveSections = async () => {
    return await HomepageSection.findAll({
        where: { isActive: true },
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
};

export const getSectionsByType = async (sectionType: string) => {
    return await HomepageSection.findAll({
        where: { sectionType, isActive: true },
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
};

export const createSection = async (data: {
    sectionType: 'collections' | 'bestsellers' | 'health_wellness' | 'new_arrivals' | 'story' | 'testimonials' | 'instagram' | 'contact';
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
    const transaction = await sequelize.transaction();
    try {
        const section = await HomepageSection.create(
            {
                ...data,
                isActive: data.isActive ?? true,
                order: data.order ?? 0
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Section created', { sectionId: section.id });
        return section;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating section', { error });
        throw error;
    }
};

export const updateSection = async (id: string, data: Partial<{
    sectionType: 'collections' | 'bestsellers' | 'health_wellness' | 'new_arrivals' | 'story' | 'testimonials' | 'instagram' | 'contact';
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
}>) => {
    const transaction = await sequelize.transaction();
    try {
        const section = await HomepageSection.findByPk(id, { transaction });
        if (!section) throw new Error('Section not found');
        const updated = await section.update(data, { transaction });
        await transaction.commit();
        logger.info('Section updated', { sectionId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating section', { sectionId: id, error });
        throw error;
    }
};

export const deleteSection = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const section = await HomepageSection.findByPk(id, { transaction });
        if (!section) throw new Error('Section not found');
        await section.destroy({ transaction });
        await transaction.commit();
        logger.info('Section deleted', { sectionId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting section', { sectionId: id, error });
        throw error;
    }
};

// ===================== TESTIMONIAL SERVICES =====================
export const getActiveTestimonials = async () => {
    return await Testimonial.findAll({
        where: { isActive: true },
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
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
    const transaction = await sequelize.transaction();
    try {
        const testimonial = await Testimonial.create(
            {
                ...data,
                isActive: data.isActive ?? true,
                order: data.order ?? 0
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Testimonial created', { testimonialId: testimonial.id });
        return testimonial;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating testimonial', { error });
        throw error;
    }
};

export const updateTestimonial = async (id: string, data: Partial<{
    author: string;
    initials: string;
    location: string;
    comment: string;
    rating: number;
    isActive: boolean;
    order: number;
}>) => {
    const transaction = await sequelize.transaction();
    try {
        const testimonial = await Testimonial.findByPk(id, { transaction });
        if (!testimonial) throw new Error('Testimonial not found');
        const updated = await testimonial.update(data, { transaction });
        await transaction.commit();
        logger.info('Testimonial updated', { testimonialId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating testimonial', { testimonialId: id, error });
        throw error;
    }
};

export const deleteTestimonial = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const testimonial = await Testimonial.findByPk(id, { transaction });
        if (!testimonial) throw new Error('Testimonial not found');
        await testimonial.destroy({ transaction });
        await transaction.commit();
        logger.info('Testimonial deleted', { testimonialId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting testimonial', { testimonialId: id, error });
        throw error;
    }
};

// ===================== INSTAGRAM POST SERVICES =====================
export const getActiveInstagramPosts = async () => {
    return await InstagramPost.findAll({
        where: { isActive: true },
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
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
                order: data.order ?? 0
            },
            { transaction }
        );
        await transaction.commit();
        logger.info('Instagram post created', { postId: post.id });
        return post;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating Instagram post', { error });
        throw error;
    }
};

export const updateInstagramPost = async (id: string, data: Partial<{
    imageUrl: string;
    altText?: string;
    link?: string;
    isActive: boolean;
    order: number;
}>) => {
    const transaction = await sequelize.transaction();
    try {
        const post = await InstagramPost.findByPk(id, { transaction });
        if (!post) throw new Error('Instagram post not found');
        const updated = await post.update(data, { transaction });
        await transaction.commit();
        logger.info('Instagram post updated', { postId: id });
        return updated;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error updating Instagram post', { postId: id, error });
        throw error;
    }
};

export const deleteInstagramPost = async (id: string) => {
    const transaction = await sequelize.transaction();
    try {
        const post = await InstagramPost.findByPk(id, { transaction });
        if (!post) throw new Error('Instagram post not found');
        await post.destroy({ transaction });
        await transaction.commit();
        logger.info('Instagram post deleted', { postId: id });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error deleting Instagram post', { postId: id, error });
        throw error;
    }
};

// ===================== HOMEPAGE DATA AGGREGATOR =====================
export const getHomepageData = async () => {
    const [banners, hero, sections, testimonials, instagramPosts] = await Promise.all([
        getActiveBanners(),
        getActiveHero(),
        getActiveSections(),
        getActiveTestimonials(),
        getActiveInstagramPosts()
    ]);

    return {
        banners,
        hero,
        sections,
        testimonials,
        instagramPosts
    };
};