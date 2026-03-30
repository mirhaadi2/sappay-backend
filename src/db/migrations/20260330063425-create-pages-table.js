'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pages', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      type: {
        type: Sequelize.ENUM('about_us', 'shipping_policy', 'returns_refunds', 'faqs', 'terms_conditions'),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      meta_title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      meta_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Adding indexes for performance and to enforce one page per type
    await queryInterface.addIndex('pages', ['slug']);
    await queryInterface.addIndex('pages', ['type'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pages');
    // Drop the ENUM type explicitly for PostgreSQL if necessary
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pages_type";');
  }
};