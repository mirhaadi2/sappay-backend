'use strict';

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    up: async (queryInterface) => {
        // 1. Create Tables
        await queryInterface.createTable('homepage_banners', {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
            text: { type: DataTypes.STRING(500), allowNull: false },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
            order: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            deleted_at: { type: DataTypes.DATE, allowNull: true }
        });

        await queryInterface.createTable('homepage_hero', {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
            title: { type: DataTypes.STRING(255), allowNull: false },
            subtitle: { type: DataTypes.TEXT, allowNull: false },
            video_url: { type: DataTypes.STRING(500), allowNull: false },
            video_poster_url: { type: DataTypes.STRING(500), allowNull: true },
            cta_text: { type: DataTypes.STRING(100), allowNull: false },
            cta_link: { type: DataTypes.STRING(500), allowNull: false },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            deleted_at: { type: DataTypes.DATE, allowNull: true }
        });

        await queryInterface.createTable('homepage_sections', {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
            section_type: {
                type: DataTypes.ENUM('collections', 'bestsellers', 'health_wellness', 'new_arrivals', 'story', 'testimonials', 'instagram', 'contact', 'about', 'footer'),
                allowNull: false
            },
            title: { type: DataTypes.STRING(255), allowNull: false },
            subtitle: { type: DataTypes.TEXT, allowNull: true },
            content: { type: DataTypes.TEXT, allowNull: true },
            image_url: { type: DataTypes.STRING(500), allowNull: true },
            video_url: { type: DataTypes.STRING(500), allowNull: true },
            video_poster_url: { type: DataTypes.STRING(500), allowNull: true }, // Added column
            button_text: { type: DataTypes.STRING(100), allowNull: true },
            button_link: { type: DataTypes.STRING(500), allowNull: true },
            background_image_url: { type: DataTypes.STRING(500), allowNull: true },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
            order: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            deleted_at: { type: DataTypes.DATE, allowNull: true }
        });

        await queryInterface.createTable('testimonials', {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
            author: { type: DataTypes.STRING(255), allowNull: false },
            initials: { type: DataTypes.STRING(10), allowNull: false },
            location: { type: DataTypes.STRING(255), allowNull: false },
            comment: { type: DataTypes.TEXT, allowNull: false },
            rating: { type: DataTypes.INTEGER, allowNull: false },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
            order: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            deleted_at: { type: DataTypes.DATE, allowNull: true }
        });

        await queryInterface.createTable('instagram_posts', {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
            image_url: { type: DataTypes.STRING(500), allowNull: false },
            alt_text: { type: DataTypes.STRING(255), allowNull: true },
            link: { type: DataTypes.STRING(500), allowNull: true },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
            order: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            deleted_at: { type: DataTypes.DATE, allowNull: true }
        });

        await queryInterface.createTable('website_settings', {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
            key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
            value: { type: DataTypes.TEXT, allowNull: false },
            type: { type: DataTypes.ENUM('string', 'number', 'boolean', 'json'), allowNull: false },
            category: { type: DataTypes.STRING(100), allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            deleted_at: { type: DataTypes.DATE, allowNull: true }
        });

        await queryInterface.createTable('website_pages', {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
            slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
            title: { type: DataTypes.STRING(255), allowNull: false },
            content: { type: DataTypes.TEXT, allowNull: false },
            meta_title: { type: DataTypes.STRING(255), allowNull: true },
            meta_description: { type: DataTypes.TEXT, allowNull: true },
            is_published: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
            order: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
            deleted_at: { type: DataTypes.DATE, allowNull: true }
        });

        // 2. Insert Default Data
        const now = new Date();

        await queryInterface.bulkInsert('homepage_banners', [{
            id: uuidv4(),
            text: 'Free shipping on orders over ₹ 49 | Use code SAPPEY10 for 10% OFF',
            is_active: true,
            order: 1,
            created_at: now,
            updated_at: now
        }]);

        await queryInterface.bulkInsert('homepage_hero', [{
            id: uuidv4(),
            title: 'Shop Premium Dry Fruits & Nuts',
            subtitle: 'Carefully sourced, perfectly packed, and delivered fresh to your doorstep.',
            video_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_1.mp4',
            video_poster_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_1-poster.png',
            cta_text: 'Explore Collections',
            cta_link: '/collections',
            is_active: true,
            created_at: now,
            updated_at: now
        }]);

        await queryInterface.bulkInsert('homepage_sections', [
            { id: uuidv4(), section_type: 'collections', title: 'Explore All Collections', subtitle: 'From creamy cashews to crunchy almonds - discover our full range of premium dry fruits.', is_active: true, order: 1, created_at: now, updated_at: now },
            { id: uuidv4(), section_type: 'bestsellers', title: 'Customer Favorites', subtitle: 'Bestsellers', is_active: true, order: 2, created_at: now, updated_at: now },
            { id: uuidv4(), section_type: 'health_wellness', title: 'Stay Strong with Almonds', subtitle: 'Rich in Vitamin E, magnesium, and healthy fats.', button_text: 'Shop Almond Range', button_link: '/shop?category=almonds', background_image_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_3.png', is_active: true, order: 3, created_at: now, updated_at: now },
            { id: uuidv4(), section_type: 'new_arrivals', title: 'Just Landed', subtitle: 'New Arrivals', is_active: true, order: 4, created_at: now, updated_at: now },
            { id: uuidv4(), section_type: 'story', title: 'From Farm to Your Table', subtitle: 'Watch how we carefully source and pack.', video_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_1.mp4', video_poster_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_1-poster.png', is_active: true, order: 5, created_at: now, updated_at: now },
            { id: uuidv4(), section_type: 'testimonials', title: 'What Our Customers Say', subtitle: 'Loved by Thousands', is_active: true, order: 6, created_at: now, updated_at: now },
            { id: uuidv4(), section_type: 'instagram', title: '@sappey.official', subtitle: 'Follow Our Journey', is_active: true, order: 7, created_at: now, updated_at: now },
            { id: uuidv4(), section_type: 'contact', title: 'Get in Touch', subtitle: 'Have questions? We\'d love to hear from you.', is_active: true, order: 8, created_at: now, updated_at: now }
        ]);

        await queryInterface.bulkInsert('testimonials', [
            { id: uuidv4(), author: 'Sarah Johnson', initials: 'SJ', location: 'New York, USA', comment: 'The quality of these dry fruits is exceptional.', rating: 5, is_active: true, order: 1, created_at: now, updated_at: now },
            { id: uuidv4(), author: 'Mike Chen', initials: 'MC', location: 'California, USA', comment: 'Best almonds I\'ve ever tasted.', rating: 5, is_active: true, order: 2, created_at: now, updated_at: now },
            { id: uuidv4(), author: 'Priya Patel', initials: 'PP', location: 'London, UK', comment: 'Authentic Indian dry fruits. Amazing!', rating: 5, is_active: true, order: 3, created_at: now, updated_at: now }
        ]);

        await queryInterface.bulkInsert('instagram_posts', [
            { id: uuidv4(), image_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_2.png', is_active: true, order: 1, created_at: now, updated_at: now },
            { id: uuidv4(), image_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_3.png', is_active: true, order: 2, created_at: now, updated_at: now },
            { id: uuidv4(), image_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_4.png', is_active: true, order: 3, created_at: now, updated_at: now },
            { id: uuidv4(), image_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_5.png', is_active: true, order: 4, created_at: now, updated_at: now },
            { id: uuidv4(), image_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_2.png', is_active: true, order: 5, created_at: now, updated_at: now },
            { id: uuidv4(), image_url: 'https://c.animaapp.com/mmlqdzfpT0CVfh/img/ai_5.png', is_active: true, order: 6, created_at: now, updated_at: now }
        ]);

        await queryInterface.bulkInsert('website_settings', [
            { id: uuidv4(), key: 'site_name', value: 'Sappey', type: 'string', category: 'general', description: 'Website name', is_active: true, created_at: now, updated_at: now },
            { id: uuidv4(), key: 'site_description', value: 'Premium dry fruits and nuts', type: 'string', category: 'general', description: 'Website description', is_active: true, created_at: now, updated_at: now },
            { id: uuidv4(), key: 'contact_email', value: 'hello@sappey.com', type: 'string', category: 'contact', description: 'Contact email', is_active: true, created_at: now, updated_at: now },
            { id: uuidv4(), key: 'contact_phone', value: '+91-1234567890', type: 'string', category: 'contact', description: 'Contact phone', is_active: true, created_at: now, updated_at: now }
        ]);
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('website_pages');
        await queryInterface.dropTable('website_settings');
        await queryInterface.dropTable('instagram_posts');
        await queryInterface.dropTable('testimonials');
        await queryInterface.dropTable('homepage_sections');
        await queryInterface.dropTable('homepage_hero');
        await queryInterface.dropTable('homepage_banners');

        // Drop Enums
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_homepage_sections_section_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_website_settings_type";');
    }
};