'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupons', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      code: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      type: {
        type: Sequelize.ENUM('fixed_discount', 'percentage_discount', 'free_shipping', 'free_order'),
        allowNull: false,
      },
      discount_value: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      min_order_value: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      max_discount_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      valid_from: { type: Sequelize.DATE, allowNull: false },
      valid_until: { type: Sequelize.DATE, allowNull: false },
      usage_limit: { type: Sequelize.INTEGER, allowNull: true },
      current_usage: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      per_user_limit: { type: Sequelize.INTEGER, allowNull: true },
      applicable_categories: { type: Sequelize.JSONB, allowNull: true, defaultValue: null },
      applicable_products: { type: Sequelize.JSONB, allowNull: true, defaultValue: null },
      exclude_products: { type: Sequelize.JSONB, allowNull: true, defaultValue: null },
      first_order_only: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('coupons', ['code'], { name: 'idx_coupons_code' });
    await queryInterface.addIndex('coupons', ['is_active'], { name: 'idx_coupons_is_active' });
    await queryInterface.addIndex('coupons', ['valid_from', 'valid_until'], { name: 'idx_coupons_valid_dates' });
    await queryInterface.addIndex('coupons', ['type'], { name: 'idx_coupons_type' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('coupons', 'idx_coupons_code');
    await queryInterface.removeIndex('coupons', 'idx_coupons_is_active');
    await queryInterface.removeIndex('coupons', 'idx_coupons_valid_dates');
    await queryInterface.removeIndex('coupons', 'idx_coupons_type');
    await queryInterface.dropTable('coupons');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_coupons_type";');
  },
};
