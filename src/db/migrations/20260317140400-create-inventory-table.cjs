'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      sellerProductId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'seller_products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'seller_product_id',
      },
      totalStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_stock',
      },
      availableStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'available_stock',
      },
      reservedStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'reserved_stock',
      },
      soldStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'sold_stock',
        defaultValue: 0,
      },
      reorderLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
        field: 'reorder_level',
      },
      lastRestockedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_restocked_at',
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
        field: 'updated_at'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    });

    // Add indexes
    await queryInterface.addIndex('inventory', ['seller_product_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory');
  },
};
