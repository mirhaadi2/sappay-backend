'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if column exists and get current definition
      const table = await queryInterface.describeTable('seller_products');
      
      if (table.cost_price) {
        // Column exists, try to update it
        try {
          await queryInterface.changeColumn(
            'seller_products',
            'cost_price',
            {
              type: Sequelize.DECIMAL(12, 2),
              allowNull: true,
            }
          );
          console.log('✅ Updated cost_price column to nullable');
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('duplicate')) {
            console.log('⚠️  Column constraint already exists, skipping...');
          } else {
            throw err;
          }
        }
      } else {
        // Column doesn't exist, add it
        await queryInterface.addColumn(
          'seller_products',
          'cost_price',
          {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: true,
            field: 'cost_price',
          }
        );
        console.log('✅ Added cost_price column');
      }
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⚠️  Migration already applied, skipping...');
      } else {
        throw err;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('seller_products');
      
      if (table.cost_price) {
        await queryInterface.changeColumn(
          'seller_products',
          'cost_price',
          {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false,
          }
        );
      }
    } catch (err) {
      console.log('⚠️  Rollback: Column state check failed, skipping...');
    }
  },
};
