"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.removeColumn("order_items", "seller_id");
    // await queryInterface.removeColumn("order_items", "seller_product_id");
    await queryInterface.addColumn("order_items", "product_id", {
      type: Sequelize.UUID,
      allowNull: false,
      foreignKey: true,
      references: {
        model: "products",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addColumn("order_items", "product_variant_id", {
      type: Sequelize.UUID,
      allowNull: false,
      foreignKey: true,
      references: {
        model: "product_variants",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.addColumn("order_items", "sku", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("order_items", "product_id");
    await queryInterface.removeColumn("order_items", "product_variant_id");
    await queryInterface.removeColumn("order_items", "sku");
  },
};
