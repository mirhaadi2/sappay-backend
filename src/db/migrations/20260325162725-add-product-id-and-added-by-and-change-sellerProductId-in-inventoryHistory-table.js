'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add discounted_price column
    await queryInterface.addColumn('inventory_history', 'product_id', {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add discounted_percent column
    await queryInterface.changeColumn('inventory_history', 'seller_product_id', {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('inventory_history', 'added_by', {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('inventory_history', 'product_id');
    await queryInterface.removeColumn('inventory_history', 'added_by');
    await queryInterface.changeColumn('inventory_history', 'seller_product_id', {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
    });
  }
};