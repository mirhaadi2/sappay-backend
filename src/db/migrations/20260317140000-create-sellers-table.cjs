'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Enum Type for Seller Status if not exists
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE seller_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('sellers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'user_id'
      },
      businessName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        field: 'business_name'
      },
      businessRegistrationNo: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        field: 'business_registration_no'
      },
      businessType: {
        type: Sequelize.ENUM('SOLE_PROPRIETOR', 'PARTNERSHIP', 'COMPANY'),
        allowNull: false,
        field: 'business_type'
      },
      gstNumber: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
        field: 'gst_number'
      },
      businessAddress: {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'business_address'
      },
      businessPhone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        field: 'business_phone'
      },
      ownerName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'owner_name'
      },
      ownerEmail: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'owner_email'
      },
      bankAccountName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'bank_account_name'
      },
      bankAccountNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        field: 'bank_account_number'
      },
      bankIfscCode: {
        type: Sequelize.STRING(20),
        allowNull: false,
        field: 'bank_ifsc_code'
      },
      commissionRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 5.0,
        field: 'commission_rate'
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'approved_at'
      },
      rejectedReason: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'rejected_reason'
      },
      onboardingStep: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'onboarding_step'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
        field: 'updated_at'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at'
      },
    });

    // Add indexes
    await queryInterface.addIndex('sellers', ['user_id']);
    await queryInterface.addIndex('sellers', ['status']);
    await queryInterface.addIndex('sellers', ['gst_number']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sellers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS seller_status;');
  },
};
