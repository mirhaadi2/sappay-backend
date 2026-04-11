'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add Business ID Type
    await queryInterface.addColumn('sellers', 'business_id_type', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'business_type',
    });

    // 2. Add Password
    await queryInterface.addColumn('sellers', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'owner_email',
    });
  }, // Fixed the extra brace here

  down: async (queryInterface, Sequelize) => {
    // Senior Tip: Always remove in reverse order of addition
    await queryInterface.removeColumn('sellers', 'password');
    await queryInterface.removeColumn('sellers', 'business_id_type');
  },
};