'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('seller_products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      sellerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'sellers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'seller_id',
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'product_id',
      },
      sellerSku: {
        type: Sequelize.STRING(100),
        allowNull: true,
        field: 'seller_sku',
      },
      sellerPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        field: 'seller_price',
      },
      costPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        field: 'cost_price',
      },
      weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      dimensions: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      warrantyMonths: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'warranty_months',
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'DISCONTINUED'),
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
      },
    });

    // Add unique constraint and indexes
    await queryInterface.addConstraint('seller_products', {
      fields: ['seller_id', 'product_id'],
      type: 'unique',
      name: 'unique_seller_product',
    });
    await queryInterface.addIndex('seller_products', ['seller_id']);
    await queryInterface.addIndex('seller_products', ['product_id']);
    await queryInterface.addIndex('seller_products', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('seller_products');
  },
};
