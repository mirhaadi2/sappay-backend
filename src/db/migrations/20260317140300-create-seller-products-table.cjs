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
      },
      sellerSku: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sellerPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      costPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
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
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Add unique constraint and indexes
    await queryInterface.addConstraint('seller_products', {
      fields: ['sellerId', 'productId'],
      type: 'unique',
      name: 'unique_seller_product',
    });
    await queryInterface.addIndex('seller_products', ['sellerId']);
    await queryInterface.addIndex('seller_products', ['productId']);
    await queryInterface.addIndex('seller_products', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('seller_products');
  },
};
