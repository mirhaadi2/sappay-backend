'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add new Discount columns
    await queryInterface.addColumn('products', 'discounted_price', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.00,
    });

    await queryInterface.addColumn('products', 'discounted_percent', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.00,
    });

    // 2. Fix gst_rate: Convert from DECIMAL to ENUM
    
    // Step A: Create the ENUM type if it doesn't exist
    await queryInterface.sequelize.query(
      `DO $$ BEGIN
        CREATE TYPE "enum_products_gst_rate" AS ENUM('0', '5', '12', '18', '28');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    );

    // Step B: Drop the existing default constraint (This fixes your error)
    await queryInterface.sequelize.query(
      `ALTER TABLE "products" ALTER COLUMN "gst_rate" DROP DEFAULT;`
    );

    // Step C: Change the column type with explicit casting
    await queryInterface.sequelize.query(
      `ALTER TABLE "products" 
       ALTER COLUMN "gst_rate" TYPE "enum_products_gst_rate" 
       USING ("gst_rate"::int::text::"enum_products_gst_rate");`
    );

    // Step D: Set the new proper ENUM default
    await queryInterface.sequelize.query(
      `ALTER TABLE "products" ALTER COLUMN "gst_rate" SET DEFAULT '0';`
    );
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Revert gst_rate back to DECIMAL
    await queryInterface.sequelize.query(
      `ALTER TABLE "products" ALTER COLUMN "gst_rate" DROP DEFAULT;`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "products" 
       ALTER COLUMN "gst_rate" TYPE DECIMAL(5, 2) 
       USING ("gst_rate"::text::decimal);`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "products" ALTER COLUMN "gst_rate" SET DEFAULT 0.00;`
    );
    
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_gst_rate";');

    // 2. Remove the new columns
    await queryInterface.removeColumn('products', 'discounted_price');
    await queryInterface.removeColumn('products', 'discounted_percent');
  }
};