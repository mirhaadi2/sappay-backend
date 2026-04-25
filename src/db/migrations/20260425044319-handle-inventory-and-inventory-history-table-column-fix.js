'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Update Inventory Table Columns
    const inventoryColumns = ['total_stock', 'available_stock', 'reserved_stock', 'sold_stock'];
    
    for (const column of inventoryColumns) {
      await queryInterface.changeColumn('inventory', column, {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }

    // 2. Update Inventory History Table Columns
    // Note: 'quantity' should also be DECIMAL to handle partial weights
    const historyColumns = ['previous_stock', 'new_stock', 'quantity'];

    for (const column of historyColumns) {
      await queryInterface.changeColumn('inventory_history', column, {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert Inventory Table to INTEGER
    const inventoryColumns = ['total_stock', 'available_stock', 'reserved_stock', 'sold_stock'];
    
    for (const column of inventoryColumns) {
      await queryInterface.changeColumn('inventory', column, {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    // Revert History Table to INTEGER
    const historyColumns = ['previous_stock', 'new_stock', 'quantity'];

    for (const column of historyColumns) {
      await queryInterface.changeColumn('inventory_history', column, {
        type: Sequelize.INTEGER,
        allowNull: false,
      });
    }
  }
};