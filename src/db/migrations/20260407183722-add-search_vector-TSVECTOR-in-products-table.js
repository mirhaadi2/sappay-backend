'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Add the tsvector column using raw SQL (Sequelize doesn't have built-in TSVECTOR type)
      await queryInterface.sequelize.query(
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;`,
        { transaction }
      );

      // 2. Create the GIN Index using raw SQL for full control
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);`,
        { transaction }
      );

      // 3. Create the trigger function
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_product_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.search_vector := 
            setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `, { transaction });

      // 4. Create the trigger
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS tsvectorupdate ON products;
        CREATE TRIGGER tsvectorupdate
        BEFORE INSERT OR UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION update_product_search_vector();
      `, { transaction });

      // 5. Backfill existing products with search vectors
      await queryInterface.sequelize.query(`
        UPDATE products 
        SET search_vector = 
          setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(description, '')), 'B')
        WHERE search_vector IS NULL;
      `, { transaction });

      await transaction.commit();
      console.log('✅ Full-text search migration completed successfully');
    } catch (err) {
      await transaction.rollback();
      console.error('❌ Migration failed:', err.message);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Cleanup in reverse order
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS tsvectorupdate ON products;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `DROP FUNCTION IF EXISTS update_product_search_vector();`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS idx_products_search;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE products DROP COLUMN IF EXISTS search_vector;`,
        { transaction }
      );

      await transaction.commit();
      console.log('✅ Full-text search migration rolled back successfully');
    } catch (err) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', err.message);
      throw err;
    }
  }
};
