'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get table description to check existing columns
      const table = await queryInterface.describeTable('orders', { transaction });

      // 1. Add new columns if they don't exist
      if (!table.tracking_number) {
        await queryInterface.addColumn('orders', 'tracking_number', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!table.status_reason) {
        await queryInterface.addColumn('orders', 'status_reason', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      // 2. Safely add new values to the ENUM
      const dialect = queryInterface.sequelize.getDialect();

      if (dialect === 'postgres') {
        const newStatuses = ['PACKED', 'HANDOVER', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'RTO'];
        for (const status of newStatuses) {
          try {
            await queryInterface.sequelize.query(
              `ALTER TYPE "enum_Orders_status" ADD VALUE IF NOT EXISTS '${status}';`,
              { transaction }
            );
          } catch (error) {
            // Value might already exist, ignore
            console.log(`Status ${status} may already exist`);
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
          }, { transaction });
        } catch (error) {
          // ENUM might already be updated
          console.log('ENUM update may have already been applied');
        }
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
      const table = await queryInterface.describeTable('orders', { transaction });

      // Remove columns if they exist
      if (table.tracking_number) {
        await queryInterface.removeColumn('orders', 'tracking_number', { transaction });
      }

      if (table.status_reason) {
        await queryInterface.removeColumn('orders', 'status_reason', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};