'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the incorrect foreign key if it exists
    await queryInterface.removeConstraint('orders', 'orders_customer_id_fkey').catch(() => {});

    // Add correct foreign key constraint to customers.id
    await queryInterface.addConstraint('orders', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'orders_customer_id_fkey',
      references: {
        table: 'customers',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('orders', 'orders_customer_id_fkey');
  }
};
