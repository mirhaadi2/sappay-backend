'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        field: 'category_id',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      specifications: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
      },
      basePrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        field: 'base_price',
      },
      hsn_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        field: 'hsn_code',
      },
      gst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 18.0,
      },
      certifications: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        field: 'updated_at',
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at',
      }
    });

    // Add indexes
    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['slug']);
    await queryInterface.addIndex('products', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  },
};
