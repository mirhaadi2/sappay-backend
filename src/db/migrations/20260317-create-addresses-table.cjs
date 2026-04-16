'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        unique: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        field: 'user_id'
      },
      type: {
        type: Sequelize.ENUM('HOME', 'WORK', 'OTHER'),
        allowNull: false,
        defaultValue: 'HOME',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      addressLine1: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'address_line1'
      },
      addressLine2: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'address_line2'
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      postalCode: {
        type: Sequelize.STRING(20),
        allowNull: false,
        field: 'postal_code'
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'is_default'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at'
      },
       deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at'
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('addresses', ['user_id']);
    await queryInterface.addIndex('addresses', ['user_id', 'is_default']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('addresses');
  },
};
