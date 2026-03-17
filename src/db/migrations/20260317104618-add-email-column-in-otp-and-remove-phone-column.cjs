'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('otps', 'phone');

    await queryInterface.addColumn('otps', 'email', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('otps', 'email');
  },
};
