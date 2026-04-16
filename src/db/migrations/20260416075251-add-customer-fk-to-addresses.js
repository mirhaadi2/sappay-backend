'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add foreign key constraint from customer_id to customers table
    await queryInterface.addConstraint('addresses', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'addresses_customer_id_fk',
      references: {
        table: 'customers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('addresses', 'addresses_customer_id_fk');
  }
};

