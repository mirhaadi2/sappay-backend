'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.addColumn(
      'order_items',
      'discounted_price',
      {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'order_items',
      'discounted_percent',
      {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_items', 'discounted_price');
    await queryInterface.removeColumn('order_items', 'discounted_percent');
  }
};
