'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Manually add the new values to the Postgres ENUM type
    // Replace 'enum_pages_type' with your actual enum name if it's different 
    // (Usually it is 'enum_TableName_ColumnName')
    
    const newValues = ['privacy_policy', 'terms_conditions', 'sitemap'];

    for (const value of newValues) {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_pages_type" ADD VALUE IF NOT EXISTS '${value}';
      `).catch(err => {
        // If 'IF NOT EXISTS' isn't supported in your PG version, 
        // we catch the 'duplicate' error and move on
        console.log(`Value ${value} might already exist, skipping...`);
      });
    }

    // 2. Now perform the changeColumn to sync the Sequelize model state
    return queryInterface.changeColumn('pages', 'type', {
      type: Sequelize.ENUM(
        'about_us', 
        'shipping_policy', 
        'returns_refunds', 
        'faqs', 
        'terms_conditions',
        'privacy_policy', 
        'terms_conditions', 
        'sitemap'
      ),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Note: Standard Postgres does not support removing values from an ENUM.
    // Usually, we just leave the types there or drop/recreate the table.
    return queryInterface.changeColumn('pages', 'type', {
      type: Sequelize.ENUM('about_us', 'shipping_policy', 'returns_refunds', 'faqs', 'terms_conditions'),
      allowNull: false
    });
  }
};