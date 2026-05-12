'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('homepage_hero', 'image_url', {
      type: DataTypes.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn('homepage_hero', 'background_image_url', {
      type: DataTypes.STRING(500),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('homepage_hero', 'background_image_url');
    await queryInterface.removeColumn('homepage_hero', 'image_url');
  },
};
