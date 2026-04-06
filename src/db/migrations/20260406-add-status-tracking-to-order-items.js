'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get table description to check existing columns
      const table = await queryInterface.describeTable('order_items', { transaction });

      // Add statusReason if it doesn't exist
      if (!table.status_reason) {
        await queryInterface.addColumn('order_items', 'status_reason', {
          type: Sequelize.STRING(500),
          allowNull: true,
        }, { transaction });
      }

      // Add statusUpdatedAt if it doesn't exist
      if (!table.status_updated_at) {
        await queryInterface.addColumn('order_items', 'status_updated_at', {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: Sequelize.NOW,
        }, { transaction });
      }

      // Add statusUpdatedBy if it doesn't exist
      if (!table.status_updated_by) {
        await queryInterface.addColumn('order_items', 'status_updated_by', {
          type: Sequelize.STRING(100),
          allowNull: true,
        }, { transaction });
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
      const table = await queryInterface.describeTable('order_items', { transaction });

      // Remove columns if they exist
      if (table.status_reason) {
        await queryInterface.removeColumn('order_items', 'status_reason', { transaction });
      }

      if (table.status_updated_at) {
        await queryInterface.removeColumn('order_items', 'status_updated_at', { transaction });
      }

      if (table.status_updated_by) {
        await queryInterface.removeColumn('order_items', 'status_updated_by', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
