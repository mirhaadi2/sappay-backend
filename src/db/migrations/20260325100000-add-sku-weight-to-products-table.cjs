'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'sku', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('products', 'weight', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('products', 'sku');
    await queryInterface.removeColumn('products', 'weight');
  },
};