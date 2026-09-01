import { Transaction } from 'sequelize';
import {
    HomepageBanner,
    HomepageHero,
    HomepageSection,
    Testimonial,
    InstagramPost,
} from './models';

export const getActiveBannersRecord = async () => {
    return HomepageBanner.findAll({
        where: { isActive: true },
        order: [
            ['order', 'ASC'],
            ['createdAt', 'DESC'],
        ],
    });
};

export const createBannerRecord = async (
    data: { text: string; isActive?: boolean; order?: number },
    transaction?: Transaction,
) => {
    return HomepageBanner.create(
        {
            ...data,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
        { transaction },
    );
};

export const findBannerByIdRecord = async (id: string, transaction?: Transaction) => {
    return HomepageBanner.findByPk(id, { transaction });
};

export const updateBannerRecord = async (
    id: string,
    data: Partial<{ text: string; isActive: boolean; order: number }>,
    transaction?: Transaction,
) => {
    const banner = await findBannerByIdRecord(id, transaction);
    if (!banner) throw new Error('Banner not found');
    const updated = await banner.update(data, { transaction });
    return updated;
};

export const deleteBannerRecord = async (id: string, transaction?: Transaction) => {
    const banner = await findBannerByIdRecord(id, transaction);
    if (!banner) throw new Error('Banner not found');
    await banner.destroy({ transaction });
};

export const getActiveHeroRecord = async () => {
    return HomepageHero.findOne({
        where: { isActive: true },
        order: [['createdAt', 'DESC']],
    });
};

export const deactivateOtherHeroesRecord = async (transaction?: Transaction) => {
    await HomepageHero.update({ isActive: false }, { where: { isActive: true }, transaction });
};

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
) => {
    return HomepageHero.create(
        {
            ...data,
            isActive: data.isActive ?? true,
        },
        { transaction },
    );
};

export const findHeroByIdRecord = async (id: string, transaction?: Transaction) => {
    return HomepageHero.findByPk(id, { transaction });
};

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
    const hero = await findHeroByIdRecord(id, transaction);
    if (!hero) throw new Error('Hero section not found');
    const updated = await hero.update(data, { transaction });
    return updated;
};

export const deleteHeroRecord = async (id: string, transaction?: Transaction) => {
    const hero = await findHeroByIdRecord(id, transaction);
    if (!hero) throw new Error('Hero section not found');
    await hero.destroy({ transaction });
};

export const getActiveSectionsRecord = async () => {
    return HomepageSection.findAll({
        where: { isActive: true },
        order: [
            ['order', 'ASC'],
            ['createdAt', 'DESC'],
        ],
    });
};

export const getSectionsByTypeRecord = async (sectionType: string) => {
    return HomepageSection.findAll({
        where: { sectionType, isActive: true },
        order: [
            ['order', 'ASC'],
            ['createdAt', 'DESC'],
        ],
    });
};

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
    },
    transaction?: Transaction,
) => {
    return HomepageSection.create(
        {
            ...data,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
        { transaction },
    );
};

export const findSectionByIdRecord = async (id: string, transaction?: Transaction) => {
    return HomepageSection.findByPk(id, { transaction });
};

export const updateSectionRecord = async (
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
    transaction?: Transaction,
) => {
    const section = await findSectionByIdRecord(id, transaction);
    if (!section) throw new Error('Section not found');
    const updated = await section.update(data, { transaction });
    return updated;
};

export const deleteSectionRecord = async (id: string, transaction?: Transaction) => {
    const section = await findSectionByIdRecord(id, transaction);
    if (!section) throw new Error('Section not found');
    await section.destroy({ transaction });
};

export const getActiveTestimonialsRecord = async () => {
    return Testimonial.findAll({
        where: { isActive: true },
        order: [
            ['order', 'ASC'],
            ['createdAt', 'DESC'],
        ],
    });
};

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
) => {
    return Testimonial.create(
        {
            ...data,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
        { transaction },
    );
};

export const findTestimonialByIdRecord = async (id: string, transaction?: Transaction) => {
    return Testimonial.findByPk(id, { transaction });
};

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
    const testimonial = await findTestimonialByIdRecord(id, transaction);
    if (!testimonial) throw new Error('Testimonial not found');
    const updated = await testimonial.update(data, { transaction });
    return updated;
};

export const deleteTestimonialRecord = async (id: string, transaction?: Transaction) => {
    const testimonial = await findTestimonialByIdRecord(id, transaction);
    if (!testimonial) throw new Error('Testimonial not found');
    await testimonial.destroy({ transaction });
};

export const getActiveInstagramPostsRecord = async () => {
    return InstagramPost.findAll({
        where: { isActive: true },
        order: [
            ['order', 'ASC'],
            ['createdAt', 'DESC'],
        ],
    });
};

export const createInstagramPostRecord = async (
    data: {
        imageUrl: string;
        altText?: string;
        link?: string;
        isActive?: boolean;
        order?: number;
    },
    transaction?: Transaction,
) => {
    return InstagramPost.create(
        {
            ...data,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
        },
        { transaction },
    );
};

export const findInstagramPostByIdRecord = async (id: string, transaction?: Transaction) => {
    return InstagramPost.findByPk(id, { transaction });
};

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
    const post = await findInstagramPostByIdRecord(id, transaction);
    if (!post) throw new Error('Instagram post not found');
    const updated = await post.update(data, { transaction });
    return updated;
};

export const deleteInstagramPostRecord = async (id: string, transaction?: Transaction) => {
    const post = await findInstagramPostByIdRecord(id, transaction);
    if (!post) throw new Error('Instagram post not found');
    await post.destroy({ transaction });
};
