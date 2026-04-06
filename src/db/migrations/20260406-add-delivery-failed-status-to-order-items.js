'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const statuses = [
      'PROCESSING',
      'HANDOVER',
      'OUT_FOR_DELIVERY',
      'DELIVERY_FAILED',
      'RTO',
      'FAILED'
    ];

    try {
      const dialect = queryInterface.sequelize.getDialect();

      if (dialect === 'postgres') {
        // PostgreSQL: Add each new value to the existing Type
        for (const status of statuses) {
          await queryInterface.sequelize.query(
            `ALTER TYPE "enum_order_items_status" ADD VALUE IF NOT EXISTS '${status}';`,
            { transaction }
          );
        }
      } else {
        // MySQL/MariaDB/SQLite: Redefine the column with the full list
        await queryInterface.changeColumn(
          'order_items',
          'status',
          {
            type: Sequelize.ENUM(
              'PENDING',
              'CONFIRMED',
              'PROCESSING',
              'PACKED',
              'HANDOVER',
              'SHIPPED',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'DELIVERY_FAILED',
              'RTO',
              'CANCELLED',
              'FAILED'
            ),
            allowNull: false,
            defaultValue: 'PENDING',
          },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const dialect = queryInterface.sequelize.getDialect();

      if (dialect === 'mysql' || dialect === 'mariadb') {
        // Revert to the basic original set
        await queryInterface.changeColumn(
          'order_items',
          'status',
          {
            type: Sequelize.ENUM(
              'PENDING',
              'CONFIRMED',
              'PACKED',
              'SHIPPED',
              'DELIVERED',
              'CANCELLED',
              'RETURNED'
            ),
            allowNull: false,
            defaultValue: 'PENDING',
          },
          { transaction }
        );
      }
      // Note: PostgreSQL ENUM values cannot be easily removed without dropping the type,
      // which is dangerous for production data. Usually, 'down' for Postgres enums is left empty.

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};