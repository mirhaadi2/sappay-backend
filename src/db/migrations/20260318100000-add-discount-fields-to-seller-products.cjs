'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('seller_products', 'discounted_price', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('seller_products', 'discounted_percent', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('seller_products', 'discounted_price');
    await queryInterface.removeColumn('seller_products', 'discounted_percent');
  }
};