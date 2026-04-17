'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('otps', 'contact', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn('otps', 'contact_type', {
      type: Sequelize.ENUM('email', 'phone', 'whatsapp'),
      allowNull: false,
      defaultValue: 'email',
    });

    await queryInterface.changeColumn('otps', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('otps', 'contact');
    await queryInterface.removeColumn('otps', 'contact_type');
    await queryInterface.changeColumn('otps', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};