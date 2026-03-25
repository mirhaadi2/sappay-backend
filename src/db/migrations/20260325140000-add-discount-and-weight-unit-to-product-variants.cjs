'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add discounted_price column
    await queryInterface.addColumn('product_variants', 'discounted_price', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    });

    // Add discounted_percent column
    await queryInterface.addColumn('product_variants', 'discounted_percent', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: null,
    });

    // Add weight_unit column
    await queryInterface.addColumn('product_variants', 'weight_unit', {
      type: Sequelize.ENUM('G', 'KG'),
      allowNull: true,
      defaultValue: 'G',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('product_variants', 'discounted_price');
    await queryInterface.removeColumn('product_variants', 'discounted_percent');
    await queryInterface.removeColumn('product_variants', 'weight_unit');
  }
};