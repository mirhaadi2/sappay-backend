'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupon_usages', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      coupon_id: { type: Sequelize.UUID, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false },
      order_id: { type: Sequelize.UUID, allowNull: false },
      coupon_code: { type: Sequelize.STRING(100), allowNull: true },
      discount_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      order_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      used_at: { type: Sequelize.DATE, allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('coupon_usages', ['coupon_id'], { name: 'idx_coupon_usages_coupon_id' });
    await queryInterface.addIndex('coupon_usages', ['user_id'], { name: 'idx_coupon_usages_user_id' });
    await queryInterface.addIndex('coupon_usages', ['order_id'], { name: 'idx_coupon_usages_order_id' });
    await queryInterface.addIndex('coupon_usages', ['coupon_id', 'user_id'], { name: 'idx_coupon_usages_coupon_user' });
    await queryInterface.addIndex('coupon_usages', ['coupon_code'], { name: 'idx_coupon_usages_coupon_code' });

    // Add foreign key constraint
    await queryInterface.addConstraint('coupon_usages', {
      fields: ['coupon_id'],
      type: 'foreign key',
      name: 'fk_coupon_usages_coupon',
      references: { table: 'coupons', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // remove foreign key
    await queryInterface.removeConstraint('coupon_usages', 'fk_coupon_usages_coupon');
    await queryInterface.removeIndex('coupon_usages', 'idx_coupon_usages_coupon_id');
    await queryInterface.removeIndex('coupon_usages', 'idx_coupon_usages_user_id');
    await queryInterface.removeIndex('coupon_usages', 'idx_coupon_usages_order_id');
    await queryInterface.removeIndex('coupon_usages', 'idx_coupon_usages_coupon_user');
    await queryInterface.removeIndex('coupon_usages', 'idx_coupon_usages_coupon_code');
    await queryInterface.dropTable('coupon_usages');
  },
};
