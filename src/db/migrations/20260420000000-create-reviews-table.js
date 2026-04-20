'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('reviews', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            customer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            order_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            order_item_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'order_items',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            product_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 1,
                    max: 5,
                },
            },
            comment: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_verified: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        // Add indexes for performance
        await queryInterface.addIndex('reviews', ['customer_id']);
        await queryInterface.addIndex('reviews', ['order_id']);
        await queryInterface.addIndex('reviews', ['order_item_id']);
        await queryInterface.addIndex('reviews', ['product_id']);
        // await queryInterface.addIndex('reviews', ['seller_product_id']);
        await queryInterface.addIndex('reviews', ['rating']);
        await queryInterface.addIndex('reviews', ['created_at']);

        // Add unique constraint to prevent multiple reviews for the same order item
        await queryInterface.addIndex('reviews', ['order_item_id'], {
            unique: true,
            name: 'unique_order_item_review',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('reviews');
    },
};