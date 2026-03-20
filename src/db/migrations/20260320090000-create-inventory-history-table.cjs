'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUM type if it doesn't exist
    await queryInterface.sequelize.query(`
      CREATE TYPE history_type AS ENUM (
        'STOCK_ADDED',
        'STOCK_REMOVED',
        'ORDER_PLACED',
        'ORDER_COMPLETED',
        'STOCK_RETURNED',
        'STOCK_RESERVED',
        'RESERVED_RELEASED',
        'ADJUSTMENT'
      );
    `).catch(() => {
      // Type might already exist
    });

    await queryInterface.createTable('inventory_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      inventoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'inventory',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'inventory_id',
      },
      sellerProductId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'seller_products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'seller_product_id',
      },
      type: {
        type: Sequelize.ENUM('STOCK_ADDED', 'STOCK_REMOVED', 'ORDER_PLACED', 'ORDER_COMPLETED', 'STOCK_RETURNED', 'STOCK_RESERVED', 'RESERVED_RELEASED', 'ADJUSTMENT'),
        allowNull: false,
        defaultValue: 'STOCK_ADDED',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      previousStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'previous_stock',
      },
      newStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'new_stock',
      },
      reference: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at',
      },
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('inventory_history', ['seller_product_id']);
    await queryInterface.addIndex('inventory_history', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory_history');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS history_type;').catch(() => {
      // Type might not exist
    });
  },
};
