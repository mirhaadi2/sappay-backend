'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      const dialect = queryInterface.sequelize.getDialect();

      if (dialect === 'postgres') {
        // For PostgreSQL, safely add DELIVERY_FAILED value to the ENUM
        try {
          await queryInterface.sequelize.query(
            `ALTER TYPE "enum_order_items_status" ADD VALUE IF NOT EXISTS 'DELIVERY_FAILED';`,
            { transaction }
          );
        } catch (error) {
          // Value might already exist, continue
          console.log('DELIVERY_FAILED may already exist in enum_order_items_status');
        }
      } else {
        // For MySQL/MariaDB
        try {
          await queryInterface.changeColumn('order_items', 'status', {
            type: Sequelize.ENUM(
              'PENDING',
              'CONFIRMED',
              'PACKED',
              'SHIPPED',
              'DELIVERED',
              'DELIVERY_FAILED',
              'CANCELLED',
              'RETURNED'
            ),
            allowNull: false,
            defaultValue: 'PENDING'
          }, { transaction });
        } catch (error) {
          // ENUM might already be updated
          console.log('Status ENUM may already have DELIVERY_FAILED');
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: Removing ENUM values in PostgreSQL requires a table rewrite
    // and is complex, so we skip it in down migration
  }
};
