import { HomepageBanner, HomepageHero, HomepageSection, Testimonial, InstagramPost } from './models';
import { withTransaction } from '../../../utils/transaction';
import logger from '../../../utils/logger';

// ===================== BANNER SERVICES =====================
export const getActiveBanners = async () => {
    return await HomepageBanner.findAll({
        where: { isActive: true },
        order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
};

export const createBanner = async (data: { text: string; isActive?: boolean; order?: number }) => {
  return withTransaction(async (transaction) => {
    const banner = await HomepageBanner.create(
      {
        ...data,
        isActive: data.isActive ?? true,
        order: data.order ?? 0
      },
      { transaction }
    );
    logger.info('Banner created', { bannerId: banner.id });
    return banner;
  });
};

export const updateBanner = async (id: string, data: Partial<{ text: string; isActive: boolean; order: number }>) => {
  return withTransaction(async (transaction) => {
    const banner = await HomepageBanner.findByPk(id, { transaction });
    if (!banner) throw new Error('Banner not found');
    const updated = await banner.update(data, { transaction });
    logger.info('Banner updated', { bannerId: id });
    return updated;
  });
};

export const deleteBanner = async (id: string) => {
  return withTransaction(async (transaction) => {
    const banner = await HomepageBanner.findByPk(id, { transaction });
    if (!banner) throw new Error('Banner not found');
    await banner.destroy({ transaction });
    logger.info('Banner deleted', { bannerId: id });
  });
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
    videoUrl?: string;
    imageUrl?: string;
    backgroundImageUrl?: string;
    videoPosterUrl?: string;
    buttonText: string;
    buttonLink: string;
    isActive?: boolean;
}) => {
  return withTransaction(async (transaction) => {
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
    logger.info('Hero created', { heroId: hero.id });
    return hero;
  });
};

export const updateHero = async (id: string, data: Partial<{
    title: string;
    subtitle: string;
    videoUrl?: string;
    imageUrl?: string;
    backgroundImageUrl?: string;
    videoPosterUrl?: string;
    buttonText: string;
    buttonLink: string;
    isActive: boolean;
}>) => {
  return withTransaction(async (transaction) => {
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
    logger.info('Hero updated', { heroId: id });
    return updated;
  });
};

export const deleteHero = async (id: string) => {
  return withTransaction(async (transaction) => {
    const hero = await HomepageHero.findByPk(id, { transaction });
    if (!hero) throw new Error('Hero section not found');
    await hero.destroy({ transaction });
    logger.info('Hero deleted', { heroId: id });
  });
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
  return withTransaction(async (transaction) => {
    const section = await HomepageSection.create(
      {
        ...data,
        isActive: data.isActive ?? true,
        order: data.order ?? 0
      },
      { transaction }
    );
    logger.info('Section created', { sectionId: section.id });
    return section;
  });
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
  return withTransaction(async (transaction) => {
    const section = await HomepageSection.findByPk(id, { transaction });
    if (!section) throw new Error('Section not found');
    const updated = await section.update(data, { transaction });
    logger.info('Section updated', { sectionId: id });
    return updated;
  });
};

export const deleteSection = async (id: string) => {
  return withTransaction(async (transaction) => {
    const section = await HomepageSection.findByPk(id, { transaction });
    if (!section) throw new Error('Section not found');
    await section.destroy({ transaction });
    logger.info('Section deleted', { sectionId: id });
  });
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
  return withTransaction(async (transaction) => {
    const testimonial = await Testimonial.create(
      {
        ...data,
        isActive: data.isActive ?? true,
        order: data.order ?? 0
      },
      { transaction }
    );
    logger.info('Testimonial created', { testimonialId: testimonial.id });
    return testimonial;
  });
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
  return withTransaction(async (transaction) => {
    const testimonial = await Testimonial.findByPk(id, { transaction });
    if (!testimonial) throw new Error('Testimonial not found');
    const updated = await testimonial.update(data, { transaction });
    logger.info('Testimonial updated', { testimonialId: id });
    return updated;
  });
};

export const deleteTestimonial = async (id: string) => {
  return withTransaction(async (transaction) => {
    const testimonial = await Testimonial.findByPk(id, { transaction });
    if (!testimonial) throw new Error('Testimonial not found');
    await testimonial.destroy({ transaction });
    logger.info('Testimonial deleted', { testimonialId: id });
  });
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
  return withTransaction(async (transaction) => {
    const post = await InstagramPost.create(
      {
        ...data,
        isActive: data.isActive ?? true,
        order: data.order ?? 0
      },
      { transaction }
    );
    logger.info('Instagram post created', { postId: post.id });
    return post;
  });
};

export const updateInstagramPost = async (id: string, data: Partial<{
    imageUrl: string;
    altText?: string;
    link?: string;
    isActive: boolean;
    order: number;
}>) => {
  return withTransaction(async (transaction) => {
    const post = await InstagramPost.findByPk(id, { transaction });
    if (!post) throw new Error('Instagram post not found');
    const updated = await post.update(data, { transaction });
    logger.info('Instagram post updated', { postId: id });
    return updated;
  });
};

export const deleteInstagramPost = async (id: string) => {
  return withTransaction(async (transaction) => {
    const post = await InstagramPost.findByPk(id, { transaction });
    if (!post) throw new Error('Instagram post not found');
    await post.destroy({ transaction });
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