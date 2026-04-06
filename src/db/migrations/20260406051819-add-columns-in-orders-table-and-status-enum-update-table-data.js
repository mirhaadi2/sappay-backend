'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Add new columns for tracking and reasons
      await queryInterface.addColumn('orders', 'tracking_number', {
        type: Sequelize.STRING,
        allowNull: true,
      }).catch(err => {
        if (!err.message.includes('already exists')) throw err;
      });
    } catch (e) {
      console.log('tracking_number column already exists or error:', e.message);
    }

    try {
      await queryInterface.addColumn('orders', 'status_reason', {
        type: Sequelize.STRING,
        allowNull: true,
      }).catch(err => {
        if (!err.message.includes('already exists')) throw err;
      });
    } catch (e) {
      console.log('status_reason column already exists or error:', e.message);
    }

    // 2. Add new values to the ENUM
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      const newStatuses = ['PACKED', 'HANDOVER', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'RTO'];
      for (const status of newStatuses) {
        try {
          await queryInterface.sequelize.query(
            `ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS '${status}';`
          );
          console.log(`Added status: ${status}`);
        } catch (error) {
          console.log(`Status ${status} already exists or could not be added:`, error.message);
        }
      }
    } else {
      // For MySQL/MariaDB
      try {
        await queryInterface.changeColumn('orders', 'status', {
          type: Sequelize.ENUM(
            'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 
            'HANDOVER', 'SHIPPED', 'OUT_FOR_DELIVERY', 
            'DELIVERED', 'DELIVERY_FAILED', 'RTO', 'CANCELLED', 'FAILED'
          ),
          allowNull: false,
          defaultValue: 'PENDING'
        });
        console.log('ENUM updated successfully');
      } catch (error) {
        console.log('ENUM update skipped (may already be updated):', error.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('orders', 'tracking_number');
    } catch (e) {
      console.log('Could not remove tracking_number:', e.message);
    }

    try {
      await queryInterface.removeColumn('orders', 'status_reason');
    } catch (e) {
      console.log('Could not remove status_reason:', e.message);
    }
  }
};