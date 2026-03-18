'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'order_id',
      },
      sellerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'sellers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        field: 'seller_id',
      },
      sellerProductId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'seller_products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        field: 'seller_product_id',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unitPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        field: 'unit_price',
      },
      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      taxAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'tax_amount',
      },
      itemTotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        field: 'item_total',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      trackerNumber: {
        type: Sequelize.STRING(100),
        allowNull: true,
        field: 'tracker_number',
      },
      shippedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'shipped_at',
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'delivered_at',
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
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

    // Add indexes
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['seller_id']);
    await queryInterface.addIndex('order_items', ['seller_product_id']);
    await queryInterface.addIndex('order_items', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('order_items');
  },
};
