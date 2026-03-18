'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('seller_products', 'rating', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
    });

    await queryInterface.addColumn('seller_products', 'rating_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('seller_products', 'rating');
    await queryInterface.removeColumn('seller_products', 'rating_count');
  }
};
