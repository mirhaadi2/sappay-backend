'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, modify user_id to be nullable
    await queryInterface.changeColumn('addresses', 'user_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Then add customer_id column
    await queryInterface.addColumn('addresses', 'customer_id', {
      type: Sequelize.UUID,
      allowNull: true,
      after: 'user_id',
    });

    // Create index on customer_id for faster lookups
    await queryInterface.addIndex('addresses', ['customer_id'], {
      name: 'addresses_customer_id_idx',
    });

    // Create composite index for faster lookups when searching for customer's default address
    await queryInterface.addIndex('addresses', ['customer_id', 'is_default'], {
      name: 'addresses_customer_default_idx',
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('addresses', 'addresses_customer_default_idx');
    await queryInterface.removeIndex('addresses', 'addresses_customer_id_idx');

    // Remove customer_id column
    await queryInterface.removeColumn('addresses', 'customer_id');

    // Restore user_id to not nullable (but this will fail if there are NULL values)
    // In production, you'd need to handle this differently
    await queryInterface.changeColumn('addresses', 'user_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  }
};

