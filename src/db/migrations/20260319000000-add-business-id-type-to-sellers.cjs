'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get existing columns
    const tableDescription = await queryInterface.describeTable('sellers');
    
    // 1. Add Business ID Type if it doesn't exist
    if (!tableDescription['business_id_type']) {
      await queryInterface.addColumn('sellers', 'business_id_type', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'business_type',
      });
    }

    // 2. Add Password if it doesn't exist
    if (!tableDescription['password']) {
      await queryInterface.addColumn('sellers', 'password', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'owner_email',
      });
    }
  }, // Fixed the extra brace here

  down: async (queryInterface, Sequelize) => {
    // Senior Tip: Always remove in reverse order of addition
    const tableDescription = await queryInterface.describeTable('sellers');
    
    if (tableDescription['password']) {
      await queryInterface.removeColumn('sellers', 'password');
    }
    if (tableDescription['business_id_type']) {
      await queryInterface.removeColumn('sellers', 'business_id_type');
    }
  },
};