import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../db/sequelize';

// ===================== HOMEPAGE BANNER MODEL =====================
interface HomepageBannerAttributes {
    id: string;
    text: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type HomepageBannerCreationAttributes = Optional<HomepageBannerAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class HomepageBanner extends Model<HomepageBannerAttributes, HomepageBannerCreationAttributes> implements HomepageBannerAttributes {
    public id!: string;
    public text!: string;
    public isActive!: boolean;
    public order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

HomepageBanner.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        text: { type: DataTypes.STRING(500), allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        order: { type: DataTypes.INTEGER, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'homepage_banners', timestamps: true, paranoid: true, underscored: true }
);

// ===================== HOMEPAGE HERO SECTION MODEL =====================
interface HomepageHeroAttributes {
    id: string;
    title: string;
    subtitle: string;
    videoUrl: string;
    videoPosterUrl?: string;
    ctaText: string;
    ctaLink: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type HomepageHeroCreationAttributes = Optional<HomepageHeroAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'videoPosterUrl'>;

export class HomepageHero extends Model<HomepageHeroAttributes, HomepageHeroCreationAttributes> implements HomepageHeroAttributes {
    public id!: string;
    public title!: string;
    public subtitle!: string;
    public videoUrl!: string;
    public videoPosterUrl?: string;
    public ctaText!: string;
    public ctaLink!: string;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

HomepageHero.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        subtitle: { type: DataTypes.TEXT, allowNull: false },
        videoUrl: { type: DataTypes.STRING(500), allowNull: false },
        videoPosterUrl: { type: DataTypes.STRING(500), allowNull: true },
        ctaText: { type: DataTypes.STRING(100), allowNull: false },
        ctaLink: { type: DataTypes.STRING(500), allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'homepage_hero', timestamps: true, paranoid: true, underscored: true }
);

// ===================== HOMEPAGE SECTION MODEL =====================
interface HomepageSectionAttributes {
    id: string;
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
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type HomepageSectionCreationAttributes = Optional<HomepageSectionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'subtitle' | 'content' | 'imageUrl' | 'videoUrl' | 'buttonText' | 'buttonLink' | 'backgroundImageUrl'>;

export class HomepageSection extends Model<HomepageSectionAttributes, HomepageSectionCreationAttributes> implements HomepageSectionAttributes {
    public id!: string;
    public sectionType!: 'collections' | 'bestsellers' | 'health_wellness' | 'new_arrivals' | 'story' | 'testimonials' | 'instagram' | 'contact';
    public title!: string;
    public subtitle?: string;
    public content?: string;
    public imageUrl?: string;
    public videoUrl?: string;
    public buttonText?: string;
    public buttonLink?: string;
    public backgroundImageUrl?: string;
    public isActive!: boolean;
    public order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

HomepageSection.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        sectionType: { type: DataTypes.ENUM('collections', 'bestsellers', 'health_wellness', 'new_arrivals', 'story', 'testimonials', 'instagram', 'contact'), allowNull: false, field: 'section_type' },
        title: { type: DataTypes.STRING(255), allowNull: false },
        subtitle: { type: DataTypes.TEXT, allowNull: true },
        content: { type: DataTypes.TEXT, allowNull: true },
        imageUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'image_url' },
        videoUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'video_url' },
        buttonText: { type: DataTypes.STRING(100), allowNull: true, field: 'button_text' },
        buttonLink: { type: DataTypes.STRING(500), allowNull: true, field: 'button_link' },
        backgroundImageUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'background_image_url' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        order: { type: DataTypes.INTEGER, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'homepage_sections', timestamps: true, paranoid: true, underscored: true }
);

// ===================== TESTIMONIAL MODEL =====================
interface TestimonialAttributes {
    id: string;
    author: string;
    initials: string;
    location: string;
    comment: string;
    rating: number;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type TestimonialCreationAttributes = Optional<TestimonialAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class Testimonial extends Model<TestimonialAttributes, TestimonialCreationAttributes> implements TestimonialAttributes {
    public id!: string;
    public author!: string;
    public initials!: string;
    public location!: string;
    public comment!: string;
    public rating!: number;
    public isActive!: boolean;
    public order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

Testimonial.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        author: { type: DataTypes.STRING(255), allowNull: false },
        initials: { type: DataTypes.STRING(10), allowNull: false },
        location: { type: DataTypes.STRING(255), allowNull: false },
        comment: { type: DataTypes.TEXT, allowNull: false },
        rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        order: { type: DataTypes.INTEGER, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'testimonials', timestamps: true, paranoid: true, underscored: true }
);

// ===================== INSTAGRAM POST MODEL =====================
interface InstagramPostAttributes {
    id: string;
    imageUrl: string;
    altText?: string;
    link?: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type InstagramPostCreationAttributes = Optional<InstagramPostAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'altText' | 'link'>;

export class InstagramPost extends Model<InstagramPostAttributes, InstagramPostCreationAttributes> implements InstagramPostAttributes {
    public id!: string;
    public imageUrl!: string;
    public altText?: string;
    public link?: string;
    public isActive!: boolean;
    public order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

InstagramPost.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        imageUrl: { type: DataTypes.STRING(500), allowNull: false, field: 'image_url' },
        altText: { type: DataTypes.STRING(255), allowNull: true, field: 'alt_text' },
        link: { type: DataTypes.STRING(500), allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        order: { type: DataTypes.INTEGER, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'instagram_posts', timestamps: true, paranoid: true, underscored: true }
);