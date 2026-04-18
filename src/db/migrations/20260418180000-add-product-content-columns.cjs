"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add benefits column
    await queryInterface.addColumn("products", "benefits", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: "Array of product benefits"
    });

    // Add ingredients column
    await queryInterface.addColumn("products", "ingredients", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: "Array of product ingredients"
    });

    // Add nutrition_facts column
    await queryInterface.addColumn("products", "nutrition_facts", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: "Array of nutrition facts with label and value"
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("products", "benefits");
    await queryInterface.removeColumn("products", "ingredients");
    await queryInterface.removeColumn("products", "nutrition_facts");
  },
};