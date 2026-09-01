import { withTransaction } from '../../../utils/transaction';
import logger from '../../../utils/logger';
import {
    createBannerRecord,
    createHeroRecord,
    createInstagramPostRecord,
    createSectionRecord,
    createTestimonialRecord,
    deactivateOtherHeroesRecord,
    deleteBannerRecord,
    deleteHeroRecord,
    deleteInstagramPostRecord,
    deleteSectionRecord,
    deleteTestimonialRecord,
    findBannerByIdRecord,
    findHeroByIdRecord,
    findInstagramPostByIdRecord,
    findSectionByIdRecord,
    findTestimonialByIdRecord,
    getActiveBannersRecord,
    getActiveHeroRecord,
    getActiveInstagramPostsRecord,
    getActiveSectionsRecord,
    getActiveTestimonialsRecord,
    getSectionsByTypeRecord,
    updateBannerRecord,
    updateHeroRecord,
    updateInstagramPostRecord,
    updateSectionRecord,
    updateTestimonialRecord,
} from './repository';

// ===================== BANNER SERVICES =====================
export const getActiveBanners = async () => {
    return await getActiveBannersRecord();
};

export const createBanner = async (data: { text: string; isActive?: boolean; order?: number }) => {
    return withTransaction(async (transaction) => {
        const banner = await createBannerRecord(data, transaction);
        logger.info('Banner created', { bannerId: banner.id });
        return banner;
    });
};

export const updateBanner = async (
    id: string,
    data: Partial<{ text: string; isActive: boolean; order: number }>,
) => {
    return withTransaction(async (transaction) => {
        const updated = await updateBannerRecord(id, data, transaction);
        logger.info('Banner updated', { bannerId: id });
        return updated;
    });
};

export const deleteBanner = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteBannerRecord(id, transaction);
        logger.info('Banner deleted', { bannerId: id });
    });
};

// ===================== HERO SECTION SERVICES =====================
export const getActiveHero = async () => {
    return await getActiveHeroRecord();
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
            await deactivateOtherHeroesRecord(transaction);
        }
        const hero = await createHeroRecord(data, transaction);
        logger.info('Hero created', { heroId: hero.id });
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
            await deactivateOtherHeroesRecord(transaction);
        }

        const updated = await updateHeroRecord(id, data, transaction);
        logger.info('Hero updated', { heroId: id });
        return updated;
    });
};

export const deleteHero = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteHeroRecord(id, transaction);
        logger.info('Hero deleted', { heroId: id });
    });
};

// ===================== SECTION SERVICES =====================
export const getActiveSections = async () => {
    return await getActiveSectionsRecord();
};

export const getSectionsByType = async (sectionType: string) => {
    return await getSectionsByTypeRecord(sectionType);
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
        | 'contact';
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
        logger.info('Section created', { sectionId: section.id });
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
            | 'contact';
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
        logger.info('Section updated', { sectionId: id });
        return updated;
    });
};

export const deleteSection = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteSectionRecord(id, transaction);
        logger.info('Section deleted', { sectionId: id });
    });
};

// ===================== TESTIMONIAL SERVICES =====================
export const getActiveTestimonials = async () => {
    return await getActiveTestimonialsRecord();
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
        logger.info('Testimonial created', { testimonialId: testimonial.id });
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
        logger.info('Testimonial updated', { testimonialId: id });
        return updated;
    });
};

export const deleteTestimonial = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteTestimonialRecord(id, transaction);
        logger.info('Testimonial deleted', { testimonialId: id });
    });
};

// ===================== INSTAGRAM POST SERVICES =====================
export const getActiveInstagramPosts = async () => {
    return await getActiveInstagramPostsRecord();
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
        logger.info('Instagram post created', { postId: post.id });
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
        logger.info('Instagram post updated', { postId: id });
        return updated;
    });
};

export const deleteInstagramPost = async (id: string) => {
    return withTransaction(async (transaction) => {
        await deleteInstagramPostRecord(id, transaction);
        logger.info('Instagram post deleted', { postId: id });
    });
};

// ===================== HOMEPAGE DATA AGGREGATOR =====================
export const getHomepageData = async () => {
    const [banners, hero, sections, testimonials, instagramPosts] = await Promise.all([
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
