'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add discounted_price column
    await queryInterface.addColumn('seller_products', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('seller_products', 'images', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('seller_products', 'description');
    await queryInterface.removeColumn('seller_products', 'images');
  }
};
       