'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('products', ['sku'], {
      unique: true,
      name: 'idx_products_sku_unique',
      where: {
        sku: {
          [Sequelize.Op.ne]: null,
        },
      },
    });

    await queryInterface.addIndex('product_variants', ['sku'], {
      unique: true,
      name: 'idx_product_variants_sku_unique',
      where: {
        sku: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('product_variants', 'idx_product_variants_sku_unique');
    await queryInterface.removeIndex('products', 'idx_products_sku_unique');
  },
};