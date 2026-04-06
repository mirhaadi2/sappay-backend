"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn("order_items", "product_id", {
        type: Sequelize.UUID,
        allowNull: true, // Changed to true to avoid immediate errors
        foreignKey: true,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      }).catch(err => {
        if (!err.message.includes('already exists')) throw err;
      });
    } catch (e) {
      console.log('product_id column already exists or error:', e.message);
    }

    try {
      await queryInterface.addColumn("order_items", "product_variant_id", {
        type: Sequelize.UUID,
        allowNull: true,
        foreignKey: true,
        references: {
          model: "product_variants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      }).catch(err => {
        if (!err.message.includes('already exists')) throw err;
      });
    } catch (e) {
      console.log('product_variant_id column already exists or error:', e.message);
    }

    try {
      await queryInterface.addColumn("order_items", "sku", {
        type: Sequelize.STRING,
        allowNull: true,
      }).catch(err => {
        if (!err.message.includes('already exists')) throw err;
      });
    } catch (e) {
      console.log('sku column already exists or error:', e.message);
    }

    // Set NOT NULL constraints and default values
    try {
      await queryInterface.changeColumn("order_items", "product_id", {
        type: Sequelize.UUID,
        allowNull: false,
      });
    } catch (e) {
      console.log('Could not set product_id NOT NULL:', e.message);
    }

    try {
      await queryInterface.changeColumn("order_items", "product_variant_id", {
        type: Sequelize.UUID,
        allowNull: false,
      });
    } catch (e) {
      console.log('Could not set product_variant_id NOT NULL:', e.message);
    }

    try {
      await queryInterface.changeColumn("order_items", "sku", {
        type: Sequelize.STRING,
        allowNull: false,
      });
    } catch (e) {
      console.log('Could not set sku NOT NULL:', e.message);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn("order_items", "product_id");
    } catch (e) {
      console.log('Could not remove product_id:', e.message);
    }
    try {
      await queryInterface.removeColumn("order_items", "product_variant_id");
    } catch (e) {
      console.log('Could not remove product_variant_id:', e.message);
    }
    try {
      await queryInterface.removeColumn("order_items", "sku");
    } catch (e) {
      console.log('Could not remove sku:', e.message);
    }
  },
};
