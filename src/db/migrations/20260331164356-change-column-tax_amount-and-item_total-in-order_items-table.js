'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('order_items', 'tax_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('order_items', 'item_total', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('order_items', 'tax_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    });
    await queryInterface.changeColumn('order_items', 'item_total', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    });
  },
};