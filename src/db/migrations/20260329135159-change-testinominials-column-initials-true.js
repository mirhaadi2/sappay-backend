'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('testimonials', 'initials', {
      type: Sequelize.STRING(10),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('testimonials', 'initials', {
      type: Sequelize.STRING(10),
      allowNull: false,
    });
  },
};