'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create promotions table
    await queryInterface.createTable('promotions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('fixed_discount', 'percentage_discount', 'free_gift', 'free_shipping', 'bundle', 'tiered'),
        allowNull: false
      },
      banner_text: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      min_order_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      max_order_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      min_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      max_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      applicable_categories: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      },
      applicable_products: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      },
      exclude_products: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      gift_product_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      free_text: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: false
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: false
      },
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      current_usage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      display_on_homepage: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      display_on_checkout: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      display_on_product_pages: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      badge_icon: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('promotions', ['is_active', 'valid_from', 'valid_until'], {
      name: 'idx_promotions_active_dates'
    });
    await queryInterface.addIndex('promotions', ['priority'], {
      name: 'idx_promotions_priority'
    });
    await queryInterface.addIndex('promotions', ['type'], {
      name: 'idx_promotions_type'
    });
    await queryInterface.addIndex('promotions', ['display_on_homepage', 'is_active'], {
      name: 'idx_promotions_display_homepage'
    });
    await queryInterface.addIndex('promotions', ['deleted_at'], {
      name: 'idx_promotions_deleted_at'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop all indexes
    await queryInterface.removeIndex('promotions', 'idx_promotions_active_dates');
    await queryInterface.removeIndex('promotions', 'idx_promotions_priority');
    await queryInterface.removeIndex('promotions', 'idx_promotions_type');
    await queryInterface.removeIndex('promotions', 'idx_promotions_display_homepage');
    await queryInterface.removeIndex('promotions', 'idx_promotions_deleted_at');

    // Drop the table
    await queryInterface.dropTable('promotions');

    // Drop ENUM type for PostgreSQL
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_promotions_type";');
  }
};
