const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Create staff table (separate from users table for website users)
      await queryInterface.createTable(
        'staff',
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
            allowNull: false,
          },
          phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
          },
          status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active',
          },
          department: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          manager_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: 'staff',
              key: 'id',
            },
            onDelete: 'SET NULL',
          },
          hire_date: {
            type: DataTypes.DATE,
            allowNull: true,
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

      // Create index for email lookup (fast login)
      await queryInterface.addIndex('staff', ['email'], { transaction });
      await queryInterface.addIndex('staff', ['status'], { transaction });

      // 2. Create roles table
      await queryInterface.createTable(
        'roles',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
          },
          code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
          },
          name: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          type: {
            type: DataTypes.ENUM('admin', 'staff'),
            allowNull: false,
          },
          is_system: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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

      // 3. Create permissions table
      await queryInterface.createTable(
        'permissions',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
          },
          code: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
          },
          name: {
            type: DataTypes.STRING(255),
            allowNull: false,
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          category: {
            type: DataTypes.STRING(100),
            allowNull: true,
          },
          created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
          updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      // 4. Create role_permissions junction table
      await queryInterface.createTable(
        'role_permissions',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
          },
          role_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'roles',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          permission_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'permissions',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      // Create unique index for role_permissions
      await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], {
        unique: true,
        transaction,
      });

      // 5. Create staff_roles table
      await queryInterface.createTable(
        'staff_roles',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
          },
          staff_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'staff',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          role_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'roles',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          assigned_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'staff',
              key: 'id',
            },
          },
          assigned_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
          revoked_at: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          notes: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
        },
        { transaction }
      );

      // Create unique index for active roles
      await queryInterface.addIndex('staff_roles', ['staff_id', 'role_id'], {
        unique: true,
        where: { revoked_at: null },
        transaction,
      });

      // 6. Create audit_logs table
      await queryInterface.createTable(
        'staff_audit_logs',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            unique: true,
          },
          actor_staff_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'staff',
              key: 'id',
            },
          },
          target_staff_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'staff',
              key: 'id',
            },
          },
          action: {
            type: DataTypes.STRING(50),
            allowNull: false,
          },
          resource_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
          },
          resource_id: {
            type: DataTypes.UUID,
            allowNull: true,
          },
          old_value: {
            type: DataTypes.JSON,
            allowNull: true,
          },
          new_value: {
            type: DataTypes.JSON,
            allowNull: true,
          },
          ip_address: {
            type: DataTypes.STRING(50),
            allowNull: true,
          },
          user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction }
      );

      // Create indexes for audit logs
      await queryInterface.addIndex('staff_audit_logs', ['actor_staff_id'], { transaction });
      await queryInterface.addIndex('staff_audit_logs', ['target_staff_id'], { transaction });
      await queryInterface.addIndex('staff_audit_logs', ['created_at'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Drop tables in reverse order
      await queryInterface.dropTable('staff_audit_logs', { transaction });
      await queryInterface.dropTable('staff_roles', { transaction });
      await queryInterface.dropTable('role_permissions', { transaction });
      await queryInterface.dropTable('permissions', { transaction });
      await queryInterface.dropTable('roles', { transaction });
      await queryInterface.dropTable('staff', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
