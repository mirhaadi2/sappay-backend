'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create table if it doesn't exist
    const tableExists = await queryInterface.tableExists('otps');
    if (!tableExists) {
      await queryInterface.createTable('otps', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        code: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM('registration', 'password_reset', 'login'), // Based on 'registration' in CSV
          allowNull: false,
          defaultValue: 'registration',
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          // If you want to link this directly to the customers table, 
          // you could use references, but often OTPs are kept independent 
          // until verification.
        },
        expiresAt: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'expires_at',
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
          field: 'created_at',
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
          field: 'updated_at',
        },
      });

      // Add indexes for faster lookups during verification
      try {
        await queryInterface.addIndex('otps', ['email']);
      } catch (e) {
        // Index may already exist
      }
      try {
        await queryInterface.addIndex('otps', ['code']);
      } catch (e) {
        // Index may already exist
      }
      try {
        await queryInterface.addIndex('otps', ['expires_at']);
      } catch (e) {
        // Index may already exist
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('otps');
  },
};