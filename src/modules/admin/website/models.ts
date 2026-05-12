import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
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
export interface HomepageHeroAttributes {
    id: string;
    title: string;
    subtitle: string;
    videoUrl?: string;
    imageUrl?: string;
    backgroundImageUrl?: string;
    videoPosterUrl?: string;
    buttonText: string;
    buttonLink: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type HomepageHeroCreationAttributes = Optional<HomepageHeroAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'videoPosterUrl' | 'videoUrl' | 'imageUrl' | 'backgroundImageUrl'>;

export class HomepageHero extends Model<HomepageHeroAttributes, HomepageHeroCreationAttributes> implements HomepageHeroAttributes {
    public id!: string;
    public title!: string;
    public subtitle!: string;
    public videoUrl?: string;
    public imageUrl?: string;
    public backgroundImageUrl?: string;
    public videoPosterUrl?: string;
    public buttonText!: string;
    public buttonLink!: string;
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
        videoUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'video_url' },
        imageUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'image_url' },
        backgroundImageUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'background_image_url' },
        videoPosterUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'video_poster_url' },
        buttonText: { type: DataTypes.STRING(100), allowNull: false, field: 'button_text' },
        buttonLink: { type: DataTypes.STRING(500), allowNull: false, field: 'button_link' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'homepage_hero', timestamps: true, paranoid: true, underscored: true }
);

// ===================== HOMEPAGE SECTION MODEL =====================
export interface HomepageSectionAttributes {
    id: string;
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
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type HomepageSectionCreationAttributes = Optional<HomepageSectionAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'subtitle' | 'content' | 'imageUrl' | 'videoUrl' | 'buttonText' | 'buttonLink' | 'backgroundImageUrl'>;

export class HomepageSection extends Model<HomepageSectionAttributes, HomepageSectionCreationAttributes> implements HomepageSectionAttributes {
    public id!: string;
    public sectionType!: string;
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
        sectionType: { type: DataTypes.STRING(100), allowNull: false, field: 'section_type' },
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
        initials: { type: DataTypes.STRING(10), allowNull: true },
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
export interface InstagramPostAttributes {
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

// ===================== WEBSITE SETTINGS MODEL =====================
interface WebsiteSettingAttributes {
    id: string;
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    category: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

type WebsiteSettingCreationAttributes = Optional<WebsiteSettingAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'description'>;

export class WebsiteSetting extends Model<WebsiteSettingAttributes, WebsiteSettingCreationAttributes> implements WebsiteSettingAttributes {
    public id!: string;
    public key!: string;
    public value!: string;
    public type!: 'string' | 'number' | 'boolean' | 'json';
    public category!: string;
    public description?: string;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

WebsiteSetting.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        value: { type: DataTypes.TEXT, allowNull: false },
        type: { type: DataTypes.ENUM('string', 'number', 'boolean', 'json'), allowNull: false },
        category: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'website_settings', timestamps: true, paranoid: true, underscored: true }
);

// ===================== WEBSITE PAGE MODEL =====================
interface WebsitePageAttributes {
    id: string;
    slug: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    isPublished: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

type WebsitePageCreationAttributes = Optional<WebsitePageAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'metaTitle' | 'metaDescription'>;

export class WebsitePage extends Model<WebsitePageAttributes, WebsitePageCreationAttributes> implements WebsitePageAttributes {
    public id!: string;
    public slug!: string;
    public title!: string;
    public content!: string;
    public metaTitle?: string;
    public metaDescription?: string;
    public isPublished!: boolean;
    public order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date | null;
}

WebsitePage.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        content: { type: DataTypes.TEXT, allowNull: false },
        metaTitle: { type: DataTypes.STRING(255), allowNull: true, field: 'meta_title' },
        metaDescription: { type: DataTypes.TEXT, allowNull: true, field: 'meta_description' },
        isPublished: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_published' },
        order: { type: DataTypes.INTEGER, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    { sequelize, tableName: 'website_pages', timestamps: true, paranoid: true, underscored: true }
);

// ===================== UNIFIED PAGE MODEL =====================

// 1. Define the possible page types for strict typing
export enum PageType {
    ABOUT_US = 'about_us',
    SHIPPING_POLICY = 'shipping_policy',
    RETURNS_REFUNDS = 'returns_refunds',
    FAQS = 'faqs',
    TERMS_CONDITIONS = 'terms_conditions',
    PRIVACY_POLICY = 'privacy_policy',
    SITEMAP = 'sitemap',
}

// 2. Define the Attributes interface
interface PageAttributes {
    id: string;
    type: PageType;
    slug: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

// 3. Define Creation Attributes (fields that are optional during creation)
type PageCreationAttributes = Optional<
    PageAttributes, 
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'metaTitle' | 'metaDescription' | 'isPublished'
>;

// 4. The Unified Model Class
export class Page extends Model<PageAttributes, PageCreationAttributes> implements PageAttributes {
    public id!: string;
    public type!: PageType;
    public slug!: string;
    public title!: string;
    public content!: string;
    public metaTitle?: string;
    public metaDescription?: string;
    public isPublished!: boolean;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date;
}

// 5. Initialize the Model
Page.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(PageType)),
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true, // Crucial for SEO-friendly URLs
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        metaTitle: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'meta_title',
        },
        metaDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'meta_description',
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_published',
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'deleted_at',
        },
    },
    {
        sequelize,
        tableName: 'pages',
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['slug'],
            },
            {
                unique: true,
                fields: ['type'],
            }
        ],
    }
);

// ===================== PROMOTION/OFFER MODEL =====================
export enum PromotionType {
    FIXED_DISCOUNT = 'fixed_discount',           // ₹X discount
    PERCENTAGE_DISCOUNT = 'percentage_discount', // X% discount
    FREE_GIFT = 'free_gift',                     // Free item
    FREE_SHIPPING = 'free_shipping',             // Free shipping
    BUNDLE = 'bundle',                           // Buy X get Y
    TIERED = 'tiered',                           // Different discounts per tier
}

export interface PromotionAttributes {
    id: string;
    title: string;                          // e.g., "Shop above ₹1,399 and get FREE gift"
    description?: string;                   // Detailed description
    type: PromotionType;                    // Type of promotion
    bannerText: string;                     // Short text for homepage banner/notification
    
    // Conditions
    minOrderValue?: number;                 // Minimum order value to qualify (e.g., 1399)
    maxOrderValue?: number;                 // Maximum order value (null = no limit)
    minQuantity?: number;                   // Minimum items to buy
    maxQuantity?: number;                   // Maximum items eligible
    applicableCategories?: string[];        // JSON array of category IDs (null = all)
    applicableProducts?: string[];          // JSON array of product IDs (null = all)
    excludeProducts?: string[];             // Products excluded from promo
    
    // Discount Details
    discountValue?: number;                 // Discount amount or percentage
    giftProductId?: string;                 // Product ID for free gift
    freeText?: string;                      // Free text (e.g., "100g handpicked gift pouch")
    
    // Validity
    validFrom: Date;                        // Start date
    validUntil: Date;                       // End date
    
    // Tracking & Management
    usageLimit?: number;                    // Max uses of this promo (null = unlimited)
    currentUsage: number;                   // Current number of uses
    isActive: boolean;                      // Enable/disable promotion
    priority: number;                       // Higher = shown first (0-100)
    
    // Display Settings
    displayOnHomepage: boolean;              // Show banner on homepage
    displayOnCheckout: boolean;              // Show at checkout
    displayOnProductPages: boolean;          // Show on product pages
    badgeIcon?: string;                     // Icon/emoji for badge (e.g., "🎁", "💰")
    
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

type PromotionCreationAttributes = Optional<PromotionAttributes, 
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'description' | 
    'minOrderValue' | 'maxOrderValue' | 'minQuantity' | 'maxQuantity' | 
    'applicableCategories' | 'applicableProducts' | 'excludeProducts' |
    'discountValue' | 'giftProductId' | 'freeText' | 'usageLimit' | 
    'currentUsage' | 'badgeIcon'>;

export class Promotion extends Model<PromotionAttributes, PromotionCreationAttributes> implements PromotionAttributes {
    public id!: string;
    public title!: string;
    public description?: string;
    public type!: PromotionType;
    public bannerText!: string;
    public minOrderValue?: number;
    public maxOrderValue?: number;
    public minQuantity?: number;
    public maxQuantity?: number;
    public applicableCategories?: string[];
    public applicableProducts?: string[];
    public excludeProducts?: string[];
    public discountValue?: number;
    public giftProductId?: string;
    public freeText?: string;
    public validFrom!: Date;
    public validUntil!: Date;
    public usageLimit?: number;
    public currentUsage!: number;
    public isActive!: boolean;
    public priority!: number;
    public displayOnHomepage!: boolean;
    public displayOnCheckout!: boolean;
    public displayOnProductPages!: boolean;
    public badgeIcon?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt?: Date | null;
}

Promotion.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        type: { type: DataTypes.ENUM(...Object.values(PromotionType)), allowNull: false },
        bannerText: { type: DataTypes.STRING(500), allowNull: false, field: 'banner_text' },
        minOrderValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'min_order_value' },
        maxOrderValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'max_order_value' },
        minQuantity: { type: DataTypes.INTEGER, allowNull: true, field: 'min_quantity' },
        maxQuantity: { type: DataTypes.INTEGER, allowNull: true, field: 'max_quantity' },
        applicableCategories: { 
            type: DataTypes.JSON, 
            allowNull: true, 
            defaultValue: null,
            field: 'applicable_categories'
        },
        applicableProducts: { 
            type: DataTypes.JSON, 
            allowNull: true, 
            defaultValue: null,
            field: 'applicable_products'
        },
        excludeProducts: { 
            type: DataTypes.JSON, 
            allowNull: true, 
            defaultValue: null,
            field: 'exclude_products'
        },
        discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'discount_value' },
        giftProductId: { type: DataTypes.UUID, allowNull: true, field: 'gift_product_id' },
        freeText: { type: DataTypes.STRING(255), allowNull: true, field: 'free_text' },
        validFrom: { type: DataTypes.DATE, allowNull: false, field: 'valid_from' },
        validUntil: { type: DataTypes.DATE, allowNull: false, field: 'valid_until' },
        usageLimit: { type: DataTypes.INTEGER, allowNull: true, field: 'usage_limit' },
        currentUsage: { type: DataTypes.INTEGER, defaultValue: 0, field: 'current_usage' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
        priority: { type: DataTypes.INTEGER, defaultValue: 0 },
        displayOnHomepage: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'display_on_homepage' },
        displayOnCheckout: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'display_on_checkout' },
        displayOnProductPages: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'display_on_product_pages' },
        badgeIcon: { type: DataTypes.STRING(10), allowNull: true, field: 'badge_icon' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    {
        sequelize,
        tableName: 'promotions',
        timestamps: true,
        paranoid: true,
        underscored: true,
        indexes: [
            {
                fields: ['is_active', 'valid_from', 'valid_until'],
            },
            {
                fields: ['priority'],
            },
            {
                fields: ['type'],
            }
        ],
    }
);