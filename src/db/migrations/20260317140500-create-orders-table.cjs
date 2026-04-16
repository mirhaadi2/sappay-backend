'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orderNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        field: 'order_number',
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        field: 'customer_id',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        field: 'total_amount',
      },
      discountAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'discount_amount',
      },
      taxAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'tax_amount',
      },
      shippingCost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'shipping_cost',
      },
      finalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        field: 'final_amount',
      },
      paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
        allowNull: false,
        defaultValue: 'PENDING',
        field: 'payment_status',
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: true,
        field: 'payment_method',
      },
      shippingAddressId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'addresses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        field: 'shipping_address_id',
      },
      deliveryDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'delivery_date',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'delivered_at',
      },
    });

    // Add indexes
    await queryInterface.addIndex('orders', ['customer_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['payment_status']);
    await queryInterface.addIndex('orders', ['order_number']);
    await queryInterface.addIndex('orders', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  },
};
