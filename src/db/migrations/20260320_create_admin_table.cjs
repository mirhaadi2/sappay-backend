const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'admins',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
          },
          email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
          },
          password: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          name: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: false,
          },
          status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active',
          },
          created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
          updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
          deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },
        },
        { transaction }
      );
      await queryInterface.addIndex('admins', ['email'], { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('admins');
  },
};
